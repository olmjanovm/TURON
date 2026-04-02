import { FastifyReply, FastifyRequest } from 'fastify';
import {
  DEFAULT_DELIVERY_FEE,
  OrderStatusEnum,
  PaymentStatusEnum,
  UserRoleEnum,
} from '@turon/shared';
import { prisma } from '../../../lib/prisma.js';
import { AuditService } from '../../../services/audit.service.js';
import { orderTrackingService } from '../../../services/order-tracking.service.js';
import { StatusService } from '../../../services/status.service.js';
import {
  ACTIVE_ASSIGNMENT_STATUSES,
  ORDER_INCLUDE,
  RESTAURANT_COORDS,
  hasOrderAccess,
  isOrderVisibleToRequester,
  serializeCourierOption,
  serializeOrder,
} from './order-helpers.js';
import { evaluatePromoForSubtotal } from '../promos/promo-helpers.js';

function addTracking(order: any) {
  return {
    ...serializeOrder(order),
    tracking: orderTrackingService.getSnapshot(order.id),
  };
}

async function getTrackableOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: ORDER_INCLUDE as any,
  });
}

async function getSerializedOrder(orderId: string) {
  const order = await getTrackableOrder(orderId);
  return order ? addTracking(order) : null;
}

async function publishOrderSnapshot(orderId: string) {
  const serializedOrder = await getSerializedOrder(orderId);

  if (serializedOrder) {
    orderTrackingService.publishOrderUpdate(orderId, serializedOrder);
  }

  return serializedOrder;
}

async function listAccessibleOrders(requester: any) {
  if (requester.role === UserRoleEnum.ADMIN) {
    return prisma.order.findMany({
      include: ORDER_INCLUDE as any,
      orderBy: { createdAt: 'desc' },
    });
  }

  if (requester.role === UserRoleEnum.COURIER) {
    return prisma.order.findMany({
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
  }

  return prisma.order.findMany({
    where: { userId: requester.id },
    include: ORDER_INCLUDE as any,
    orderBy: { createdAt: 'desc' },
  });
}

function roundCurrency(value: number) {
  return Math.max(0, Math.round(value * 100) / 100);
}

export async function handleCreateOrder(
  request: FastifyRequest<{ Body: any }>,
  reply: FastifyReply,
) {
  const user = request.user as any;
  const { items, deliveryAddressId, paymentMethod, promoCode, note } = request.body as any;

  const deliveryAddress = await prisma.deliveryAddress.findUnique({
    where: { id: deliveryAddressId },
  });

  if (!deliveryAddress || deliveryAddress.userId !== user.id) {
    return reply.status(403).send({ error: 'Tanlangan manzil sizga tegishli emas' });
  }

  const dbItems = await prisma.menuItem.findMany({
    where: {
      id: { in: items.map((item: any) => item.menuItemId) },
      isActive: true,
      availabilityStatus: 'AVAILABLE' as any,
      category: {
        isActive: true,
      },
    },
  });

  if (dbItems.length !== items.length) {
    return reply.status(400).send({ error: 'Ba`zi taomlar mavjud emas yoki faol emas' });
  }

  const itemMap = new Map(dbItems.map((item) => [item.id, item]));

  let subtotal = 0;
  const orderItemsData = items.map((item: any) => {
    const dbItem = itemMap.get(item.menuItemId);

    if (!dbItem) {
      throw new Error(`Menu item not found during order build: ${item.menuItemId}`);
    }

    const price = Number(dbItem.price);
    const totalPrice = roundCurrency(price * item.quantity);
    subtotal += totalPrice;

    return {
      menuItemId: dbItem.id,
      itemName: dbItem.nameUz,
      priceAtOrder: dbItem.price,
      quantity: item.quantity,
      totalPrice,
      imageUrl: dbItem.imageUrl || null,
    };
  });

  subtotal = roundCurrency(subtotal);

  let promo = null;
  let discountAmount = 0;

  if (promoCode) {
    promo = await prisma.promoCode.findFirst({
      where: { code: promoCode.trim().toUpperCase() },
    });

    const promoValidation = evaluatePromoForSubtotal(promo, subtotal);

    if (!promoValidation.isValid) {
      return reply.status(400).send({ error: promoValidation.message });
    }

    discountAmount = promoValidation.discountAmount;
  }

  const deliveryFee = DEFAULT_DELIVERY_FEE;
  const totalAmount = roundCurrency(subtotal - discountAmount + deliveryFee);

  const createdOrder = await prisma.$transaction(async (tx) => {
    return tx.order.create({
      data: {
        userId: user.id,
        deliveryAddressId,
        courierId: null,
        promoCodeId: promo?.id ?? null,
        status: OrderStatusEnum.PENDING as any,
        subtotal,
        discountAmount,
        deliveryFee,
        totalAmount,
        paymentMethod,
        paymentStatus: PaymentStatusEnum.PENDING as any,
        note: note?.trim() || null,
        destinationLat: deliveryAddress.latitude,
        destinationLng: deliveryAddress.longitude,
        items: {
          create: orderItemsData,
        },
        payment: {
          create: {
            method: paymentMethod,
            status: PaymentStatusEnum.PENDING as any,
            amount: totalAmount,
            provider:
              paymentMethod === 'MANUAL_TRANSFER'
                ? 'Manual transfer'
                : paymentMethod === 'EXTERNAL_PAYMENT'
                  ? 'External payment'
                  : null,
          },
        },
      },
      select: { id: true },
    });
  });

  const serializedOrder = await getSerializedOrder(createdOrder.id);

  await AuditService.record({
    userId: user.id,
    actorRole: user.role,
    action: 'CREATE_ORDER',
    entity: 'Order',
    entityId: createdOrder.id,
    newValue: serializedOrder,
  });

  if (serializedOrder) {
    orderTrackingService.publishOrderUpdate(createdOrder.id, serializedOrder);
  }

  return reply.status(201).send(serializedOrder);
}

export async function getMyOrders(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  const orders = await listAccessibleOrders(user);
  return reply.send(orders.map(addTracking));
}

export async function getAllOrders(request: FastifyRequest, reply: FastifyReply) {
  const orders = await prisma.order.findMany({
    include: ORDER_INCLUDE as any,
    orderBy: { createdAt: 'desc' },
  });

  return reply.send(orders.map(addTracking));
}

export async function getAvailableCouriers(request: FastifyRequest, reply: FastifyReply) {
  const couriers = await prisma.user.findMany({
    where: {
      isActive: true,
      role: UserRoleEnum.COURIER as any,
    },
    include: {
      courierAssignments: {
        where: {
          status: {
            in: ACTIVE_ASSIGNMENT_STATUSES as any,
          },
        },
      },
    },
    orderBy: { fullName: 'asc' },
  });

  return reply.send(
    couriers
      .map(serializeCourierOption)
      .sort(
        (left, right) =>
          left.activeAssignments - right.activeAssignments ||
          left.fullName.localeCompare(right.fullName),
      ),
  );
}

export async function getOrderDetail(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const requester = request.user as any;
  const order = await getTrackableOrder(request.params.id);

  if (!order) {
    return reply.status(404).send({ error: 'Buyurtma topilmadi' });
  }

  if (!hasOrderAccess(order, requester)) {
    return reply.status(403).send({ error: "Bu buyurtmaga kirish ruxsati yo'q" });
  }

  return reply.send(addTracking(order));
}

export async function streamOrderTracking(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const requester = request.user as any;
  const order = await getTrackableOrder(request.params.id);

  if (!order) {
    return reply.status(404).send({ error: 'Buyurtma topilmadi' });
  }

  if (!hasOrderAccess(order, requester)) {
    return reply.status(403).send({ error: "Bu buyurtmaga kirish ruxsati yo'q" });
  }

  reply.hijack();
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  reply.raw.flushHeaders?.();

  const sendEvent = (payload: unknown) => {
    reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  reply.raw.write('retry: 3000\n\n');
  sendEvent({
    type: 'snapshot',
    orderId: order.id,
    order: addTracking(order),
    tracking: orderTrackingService.getSnapshot(order.id),
  });

  const heartbeat = setInterval(() => {
    reply.raw.write(': keep-alive\n\n');
  }, 15_000);

  const unsubscribe = orderTrackingService.subscribe(order.id, (event) => {
    sendEvent(event);
  });

  request.raw.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    reply.raw.end();
  });
}

export async function streamOrders(request: FastifyRequest, reply: FastifyReply) {
  const requester = request.user as any;
  const initialOrders = (await listAccessibleOrders(requester)).map(addTracking);
  const accessibleOrderIds = new Set(initialOrders.map((order) => order.id));

  reply.hijack();
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  reply.raw.flushHeaders?.();

  const sendEvent = (payload: unknown) => {
    reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  reply.raw.write('retry: 3000\n\n');

  for (const order of initialOrders) {
    sendEvent({
      type: 'snapshot',
      orderId: order.id,
      order,
      tracking: orderTrackingService.getSnapshot(order.id),
    });
  }

  const heartbeat = setInterval(() => {
    reply.raw.write(': keep-alive\n\n');
  }, 15_000);

  const unsubscribe = orderTrackingService.subscribeAll((event) => {
    if (requester.role === UserRoleEnum.ADMIN) {
      sendEvent(event);
      accessibleOrderIds.add(event.orderId);
      return;
    }

    if (event.order) {
      const isVisible = isOrderVisibleToRequester(event.order, requester);

      if (isVisible) {
        accessibleOrderIds.add(event.orderId);
        sendEvent(event);
        return;
      }

      if (accessibleOrderIds.has(event.orderId)) {
        accessibleOrderIds.delete(event.orderId);
        sendEvent({
          type: 'order.removed',
          orderId: event.orderId,
        });
      }

      return;
    }

    if (accessibleOrderIds.has(event.orderId)) {
      sendEvent(event);
    }
  });

  request.raw.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    reply.raw.end();
  });
}

export async function handleUpdateStatus(
  request: FastifyRequest<{ Params: { id: string }; Body: any }>,
  reply: FastifyReply,
) {
  const admin = request.user as any;
  const { status } = request.body as any;

  const order = await prisma.order.findUnique({
    where: { id: request.params.id },
    include: {
      courierAssignments: {
        orderBy: { assignedAt: 'desc' },
      },
    },
  });

  if (!order) {
    return reply.status(404).send({ error: 'Buyurtma topilmadi' });
  }

  if (!StatusService.validateOrderStatusTransition(order.status as OrderStatusEnum, status)) {
    return reply.status(400).send({
      error: `Statusni ozgartirib bolmaydi: ${order.status} -> ${status}`,
    });
  }

  const now = new Date();
  const activeAssignment = order.courierAssignments.find((assignment: any) =>
    StatusService.isActiveAssignmentStatus(assignment.status),
  );

  if (status === OrderStatusEnum.DELIVERING && !activeAssignment) {
    return reply.status(400).send({
      error: "Buyurtmani yolga chiqarishdan oldin kuryer biriktiring",
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status },
    });

    if (status === OrderStatusEnum.DELIVERING && activeAssignment) {
      await tx.courierAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          status: 'DELIVERING' as any,
          acceptedAt: activeAssignment.acceptedAt || now,
          pickedUpAt: activeAssignment.pickedUpAt || now,
          deliveringAt: activeAssignment.deliveringAt || now,
        },
      });
    }

    if (status === OrderStatusEnum.DELIVERED && activeAssignment) {
      await tx.courierAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          status: 'DELIVERED' as any,
          acceptedAt: activeAssignment.acceptedAt || now,
          pickedUpAt: activeAssignment.pickedUpAt || now,
          deliveringAt: activeAssignment.deliveringAt || now,
          deliveredAt: activeAssignment.deliveredAt || now,
        },
      });
    }

    if (status === OrderStatusEnum.CANCELLED) {
      await tx.courierAssignment.updateMany({
        where: {
          orderId: order.id,
          status: {
            in: ACTIVE_ASSIGNMENT_STATUSES as any,
          },
        },
        data: {
          status: 'CANCELLED' as any,
          cancelledAt: now,
        },
      });
    }
  });

  await AuditService.record({
    userId: admin.id,
    actorRole: admin.role,
    action: 'STATUS_CHANGE',
    entity: 'Order',
    entityId: order.id,
    oldValue: { status: order.status },
    newValue: { status },
  });

  const serializedOrder = await publishOrderSnapshot(order.id);
  return reply.send(serializedOrder);
}

export async function handleAssignCourier(
  request: FastifyRequest<{ Params: { id: string }; Body: { courierId: string } }>,
  reply: FastifyReply,
) {
  const admin = request.user as any;
  const { courierId } = request.body;
  const order = await prisma.order.findUnique({
    where: { id: request.params.id },
    include: {
      courierAssignments: {
        include: {
          courier: true,
        },
        orderBy: { assignedAt: 'desc' },
      },
    },
  });

  if (!order) {
    return reply.status(404).send({ error: 'Buyurtma topilmadi' });
  }

  if (order.status === OrderStatusEnum.DELIVERED || order.status === OrderStatusEnum.CANCELLED) {
    return reply.status(400).send({ error: "Yakunlangan buyurtmaga kuryer biriktirib bolmaydi" });
  }

  const courier = await prisma.user.findFirst({
    where: {
      id: courierId,
      isActive: true,
      role: UserRoleEnum.COURIER as any,
    },
  });

  if (!courier) {
    return reply.status(404).send({ error: 'Tanlangan kuryer topilmadi' });
  }

  const activeAssignment = order.courierAssignments.find((assignment: any) =>
    StatusService.isActiveAssignmentStatus(assignment.status),
  );

  if (activeAssignment?.courierId === courierId) {
    return reply.send(await getSerializedOrder(order.id));
  }

  const assignmentTimestamp = new Date();

  const assignment = await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { courierId },
    });

    await tx.courierAssignment.updateMany({
      where: {
        orderId: order.id,
        status: {
          in: ACTIVE_ASSIGNMENT_STATUSES as any,
        },
      },
      data: {
        status: 'CANCELLED' as any,
        cancelledAt: assignmentTimestamp,
      },
    });

    return tx.courierAssignment.create({
      data: {
        orderId: order.id,
        courierId,
        status: 'ASSIGNED' as any,
        assignedAt: assignmentTimestamp,
      },
    });
  });

  const serializedOrder = await getSerializedOrder(order.id);

  await AuditService.record({
    userId: admin.id,
    actorRole: admin.role,
    action: activeAssignment ? 'REASSIGN_COURIER' : 'ASSIGN_COURIER',
    entity: 'Order',
    entityId: order.id,
    oldValue: {
      courierId: activeAssignment?.courierId,
      courierName: activeAssignment?.courier?.fullName,
    },
    newValue: {
      assignmentId: assignment.id,
      courierId,
      courierName: courier.fullName,
    },
  });

  if (serializedOrder) {
    orderTrackingService.publishOrderUpdate(order.id, serializedOrder);
  }
  return reply.send(serializedOrder);
}

export async function handleApprovePayment(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const admin = request.user as any;
  const order = await prisma.order.findUnique({
    where: { id: request.params.id },
    include: ORDER_INCLUDE as any,
  });

  if (!order) {
    return reply.status(404).send({ error: 'Buyurtma topilmadi' });
  }

  if (!order.payment) {
    return reply.status(400).send({ error: "Buyurtmaga tegishli to'lov topilmadi" });
  }

  if (order.paymentStatus === PaymentStatusEnum.COMPLETED) {
    return reply.send(addTracking(order));
  }

  if (order.paymentStatus !== PaymentStatusEnum.PENDING) {
    return reply.status(400).send({ error: "Faqat kutilayotgan to'lov tasdiqlanadi" });
  }

  if (order.status === OrderStatusEnum.CANCELLED) {
    return reply.status(400).send({ error: "Bekor qilingan buyurtma to'lovini tasdiqlab bo'lmaydi" });
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId: order.id },
      data: {
        status: PaymentStatusEnum.COMPLETED as any,
        verifiedByAdminId: admin.id,
        verifiedAt: now,
        rejectionReason: null,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatusEnum.COMPLETED as any,
      },
    });
  });

  const serializedOrder = await publishOrderSnapshot(order.id);

  await AuditService.record({
    userId: admin.id,
    actorRole: admin.role,
    action: 'VERIFY_PAYMENT',
    entity: 'Payment',
    entityId: order.payment.id,
    oldValue: {
      paymentStatus: order.paymentStatus,
      verifiedAt: order.payment.verifiedAt?.toISOString(),
    },
    newValue: {
      paymentStatus: PaymentStatusEnum.COMPLETED,
      verifiedAt: now.toISOString(),
      verifiedByAdminId: admin.id,
    },
    metadata: {
      orderId: order.id,
    },
  });

  return reply.send(serializedOrder);
}

export async function handleRejectPayment(
  request: FastifyRequest<{ Params: { id: string }; Body: { reason?: string } }>,
  reply: FastifyReply,
) {
  const admin = request.user as any;
  const { reason } = request.body ?? {};
  const rejectionReason = reason?.trim() || 'Admin tomonidan to\'lov rad etildi';

  const order = await prisma.order.findUnique({
    where: { id: request.params.id },
    include: ORDER_INCLUDE as any,
  });

  if (!order) {
    return reply.status(404).send({ error: 'Buyurtma topilmadi' });
  }

  if (!order.payment) {
    return reply.status(400).send({ error: "Buyurtmaga tegishli to'lov topilmadi" });
  }

  if (order.paymentStatus !== PaymentStatusEnum.PENDING) {
    return reply.status(400).send({ error: "Faqat kutilayotgan to'lov rad etiladi" });
  }

  if (order.status === OrderStatusEnum.DELIVERED) {
    return reply.status(400).send({ error: "Yetkazilgan buyurtma to'lovini rad etib bo'lmaydi" });
  }

  const now = new Date();
  const shouldCancelOrder = order.status !== OrderStatusEnum.CANCELLED;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { orderId: order.id },
      data: {
        status: PaymentStatusEnum.FAILED as any,
        rejectionReason,
        verifiedByAdminId: null,
        verifiedAt: null,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatusEnum.FAILED as any,
        status: shouldCancelOrder ? (OrderStatusEnum.CANCELLED as any) : undefined,
      },
    });

    await tx.courierAssignment.updateMany({
      where: {
        orderId: order.id,
        status: {
          in: ACTIVE_ASSIGNMENT_STATUSES as any,
        },
      },
      data: {
        status: 'CANCELLED' as any,
        cancelledAt: now,
      },
    });
  });

  const serializedOrder = await publishOrderSnapshot(order.id);

  await AuditService.record({
    userId: admin.id,
    actorRole: admin.role,
    action: 'REJECT_PAYMENT',
    entity: 'Payment',
    entityId: order.payment.id,
    oldValue: {
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      rejectionReason: order.payment.rejectionReason,
    },
    newValue: {
      paymentStatus: PaymentStatusEnum.FAILED,
      orderStatus: shouldCancelOrder ? OrderStatusEnum.CANCELLED : order.status,
      rejectionReason,
    },
    metadata: {
      orderId: order.id,
    },
  });

  if (shouldCancelOrder) {
    await AuditService.recordStatusChange({
      userId: admin.id,
      entity: 'Order',
      entityId: order.id,
      from: order.status,
      to: OrderStatusEnum.CANCELLED,
    });
  }

  return reply.send(serializedOrder);
}
