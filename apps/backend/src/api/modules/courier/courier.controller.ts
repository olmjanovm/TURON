import { FastifyReply, FastifyRequest } from 'fastify';
import { DeliveryStageEnum, OrderStatusEnum } from '@turon/shared';
import { prisma } from '../../../lib/prisma.js';
import { AuditService } from '../../../services/audit.service.js';
import { orderTrackingService } from '../../../services/order-tracking.service.js';
import { StatusService } from '../../../services/status.service.js';
import {
  ACTIVE_ASSIGNMENT_STATUSES,
  ORDER_INCLUDE,
  getActiveCourierAssignment,
  serializeOrder,
} from '../orders/order-helpers.js';

function addTracking(order: any) {
  return {
    ...serializeOrder(order),
    tracking: orderTrackingService.getSnapshot(order.id),
  };
}

function getRelevantAssignment(order: any, requester: any) {
  const activeAssignment = getActiveCourierAssignment(order);
  return activeAssignment?.courierId === requester.id ? activeAssignment : null;
}

async function getAccessibleCourierOrder(orderId: string, requester: any) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: ORDER_INCLUDE as any,
  });

  if (!order) {
    return null;
  }

  const relevantAssignment = getRelevantAssignment(order, requester);

  if (!relevantAssignment) {
    return null;
  }

  return { order, relevantAssignment };
}

export async function getCourierOrders(request: FastifyRequest, reply: FastifyReply) {
  const requester = request.user as any;

  const orders = await prisma.order.findMany({
    where: {
      courierAssignments: {
        some: {
          courierId: requester.id,
          status: {
            in: ACTIVE_ASSIGNMENT_STATUSES as any,
          },
        },
      },
    },
    include: ORDER_INCLUDE as any,
    orderBy: { createdAt: 'desc' },
  });

  const formattedOrders = orders.map((order: any) => {
    const serialized = serializeOrder(order);

    return {
      id: serialized.id,
      orderNumber: serialized.orderNumber,
      orderStatus: serialized.orderStatus,
      deliveryStage: serialized.deliveryStage,
      total: serialized.total,
      paymentMethod: serialized.paymentMethod,
      customerName: serialized.customerName || 'Mijoz',
      destinationAddress: serialized.customerAddress?.addressText || '',
      createdAt: serialized.createdAt,
      itemCount: serialized.items.length,
      courierAssignmentStatus: serialized.courierAssignmentStatus,
    };
  });

  return reply.send(formattedOrders);
}

export async function getCourierOrderDetail(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const requester = request.user as any;
  const result = await getAccessibleCourierOrder(request.params.id, requester);

  if (!result) {
    return reply.status(403).send({ error: 'Ruxsat etilmadi: Bu buyurtma sizga tegishli emas.' });
  }

  return reply.send(addTracking(result.order));
}

export async function updateOrderStage(
  request: FastifyRequest<{ Params: { id: string }; Body: { stage: DeliveryStageEnum } }>,
  reply: FastifyReply,
) {
  const requester = request.user as any;
  const { stage } = request.body;
  const result = await getAccessibleCourierOrder(request.params.id, requester);

  if (!result) {
    return reply.status(403).send({ error: 'Ruxsat etilmadi.' });
  }

  const { order, relevantAssignment } = result;
  const currentStage = StatusService.mapAssignmentStatusToDeliveryStage(
    relevantAssignment.status,
    order.status as OrderStatusEnum,
  );

  if (!StatusService.validateDeliveryStageTransition(currentStage, stage)) {
    return reply.status(400).send({
      error: `Bosqichni o'zgartirib bo'lmaydi: ${currentStage} -> ${stage}`,
    });
  }

  const nextAssignmentStatus = StatusService.mapStageToAssignmentStatus(stage);

  if (!nextAssignmentStatus) {
    return reply.status(400).send({ error: "Ushbu bosqich uchun status aniqlanmadi" });
  }

  const nextOrderStatus = StatusService.mapStageToOrderStatus(stage) ?? order.status;
  const now = new Date();
  const assignmentUpdate: Record<string, unknown> = {
    status: nextAssignmentStatus,
  };

  if (
    stage === DeliveryStageEnum.ARRIVED_AT_RESTAURANT ||
    stage === DeliveryStageEnum.PICKED_UP ||
    stage === DeliveryStageEnum.DELIVERING ||
    stage === DeliveryStageEnum.ARRIVED_AT_DESTINATION ||
    stage === DeliveryStageEnum.DELIVERED
  ) {
    assignmentUpdate.acceptedAt = relevantAssignment.acceptedAt || now;
  }

  if (
    stage === DeliveryStageEnum.PICKED_UP ||
    stage === DeliveryStageEnum.DELIVERING ||
    stage === DeliveryStageEnum.ARRIVED_AT_DESTINATION ||
    stage === DeliveryStageEnum.DELIVERED
  ) {
    assignmentUpdate.pickedUpAt = relevantAssignment.pickedUpAt || now;
  }

  if (
    stage === DeliveryStageEnum.DELIVERING ||
    stage === DeliveryStageEnum.ARRIVED_AT_DESTINATION ||
    stage === DeliveryStageEnum.DELIVERED
  ) {
    assignmentUpdate.deliveringAt = relevantAssignment.deliveringAt || now;
  }

  if (stage === DeliveryStageEnum.DELIVERED) {
    assignmentUpdate.deliveredAt = relevantAssignment.deliveredAt || now;
  }

  await prisma.$transaction(async (tx) => {
    await tx.courierAssignment.update({
      where: { id: relevantAssignment.id },
      data: assignmentUpdate as any,
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: nextOrderStatus as any,
        courierId: relevantAssignment.courierId,
      },
    });
  });

  await AuditService.record({
    userId: requester.id,
    actorRole: requester.role,
    action: 'UPDATE_DELIVERY_STAGE',
    entity: 'Order',
    entityId: order.id,
    oldValue: {
      deliveryStage: currentStage,
      orderStatus: order.status,
      assignmentStatus: relevantAssignment.status,
    },
    newValue: {
      deliveryStage: stage,
      orderStatus: nextOrderStatus,
      assignmentStatus: nextAssignmentStatus,
    },
  });

  if (nextOrderStatus !== order.status) {
    await AuditService.recordStatusChange({
      userId: requester.id,
      entity: 'Order',
      entityId: order.id,
      from: order.status,
      to: nextOrderStatus,
    });
  }

  const refreshedOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: ORDER_INCLUDE as any,
  });

  if (!refreshedOrder) {
    return reply.status(404).send({ error: 'Buyurtma topilmadi' });
  }

  const serializedOrder = addTracking(refreshedOrder);
  orderTrackingService.publishOrderUpdate(order.id, serializedOrder);

  return reply.send(serializedOrder);
}

export async function updateCourierLocation(
  request: FastifyRequest<{
    Params: { id: string };
    Body: {
      latitude: number;
      longitude: number;
      heading?: number;
      speedKmh?: number;
      remainingDistanceKm?: number;
      remainingEtaMinutes?: number;
    };
  }>,
  reply: FastifyReply,
) {
  const requester = request.user as any;
  const result = await getAccessibleCourierOrder(request.params.id, requester);

  if (!result) {
    return reply.status(403).send({ error: 'Ruxsat etilmadi.' });
  }

  const { order, relevantAssignment } = result;

  if (!ACTIVE_ASSIGNMENT_STATUSES.includes(relevantAssignment.status as any)) {
    return reply.status(400).send({
      error: "Kuryer lokatsiyasi faqat faol biriktirish uchun yuboriladi",
    });
  }

  const tracking = orderTrackingService.publishCourierLocation(order.id, {
    latitude: request.body.latitude,
    longitude: request.body.longitude,
    heading: request.body.heading,
    speedKmh: request.body.speedKmh,
    remainingDistanceKm: request.body.remainingDistanceKm,
    remainingEtaMinutes: request.body.remainingEtaMinutes,
  });

  await AuditService.record({
    userId: requester.id,
    actorRole: requester.role,
    action: 'UPDATE_COURIER_LOCATION',
    entity: 'Order',
    entityId: order.id,
    metadata: {
      assignmentId: relevantAssignment.id,
      location: request.body,
    },
  });

  return reply.send({ orderId: order.id, tracking });
}
