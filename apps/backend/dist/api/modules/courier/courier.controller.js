"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourierOrders = getCourierOrders;
exports.getCourierOrderDetail = getCourierOrderDetail;
exports.updateOrderStage = updateOrderStage;
const client_1 = require("@prisma/client");
const shared_1 = require("@turon/shared");
const status_service_1 = require("../../../services/status.service");
const audit_service_1 = require("../../../services/audit.service");
const prisma = new client_1.PrismaClient();
async function getCourierOrders(request, reply) {
    const user = request.user;
    const courierId = user.id;
    const assignments = await prisma.courierAssignment.findMany({
        where: {
            courierId,
            status: { in: [shared_1.CourierAssignmentStatusEnum.ASSIGNED, shared_1.CourierAssignmentStatusEnum.REJECTED] }
        },
        include: {
            order: {
                include: {
                    user: true,
                    deliveryAddress: true
                }
            }
        },
        orderBy: { assignedAt: 'desc' }
    });
    const formattedOrders = assignments.map(a => ({
        id: a.order.id,
        orderNumber: a.order.orderNumber,
        status: a.order.status,
        deliveryStage: a.order.deliveryStage,
        totalAmount: a.order.totalAmount,
        paymentMethod: a.order.paymentMethod,
        customerName: `${a.order.user.firstName} ${a.order.user.lastName || ''}`.trim(),
        destinationAddress: a.order.deliveryAddress.address,
        createdAt: a.order.createdAt
    }));
    return reply.send(formattedOrders);
}
async function getCourierOrderDetail(request, reply) {
    const { id } = request.params;
    const user = request.user;
    const courierId = user.id;
    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            user: true,
            deliveryAddress: true,
            courierAssignments: {
                where: { courierId }
            }
        }
    });
    if (!order || order.courierAssignments.length === 0) {
        return reply.status(403).send({ error: 'Ruxsat etilmadi: Bu buyurtma sizga tegishli emas.' });
    }
    return reply.send({
        ...order,
        customerName: `${order.user.firstName} ${order.user.lastName || ''}`,
        customerPhone: order.user.phoneNumber,
        destinationAddress: order.deliveryAddress.address,
        pickupLat: order.pickupLat || 41.311081,
        pickupLng: order.pickupLng || 69.240562,
        destinationLat: order.deliveryAddress.latitude,
        destinationLng: order.deliveryAddress.longitude
    });
}
async function updateOrderStage(request, reply) {
    const { id } = request.params;
    const { stage } = request.body;
    const user = request.user;
    const courierId = user.id;
    // 1. Fetch current order state
    const order = await prisma.order.findUnique({
        where: { id },
        include: { courierAssignments: { where: { courierId } } }
    });
    if (!order || order.courierAssignments.length === 0) {
        return reply.status(403).send({ error: 'Ruxsat etilmadi.' });
    }
    // 2. Sequential Validation via StatusService
    const currentStage = order.deliveryStage;
    const isValidTransition = status_service_1.StatusService.validateDeliveryStageTransition(currentStage, stage);
    if (!isValidTransition) {
        return reply.status(400).send({
            error: `Bosqichni o'zgartirib bo'lmaydi: ${currentStage} -> ${stage}`
        });
    }
    // 3. Update Order and Record Time
    const updateData = {
        deliveryStage: stage,
    };
    const newStatus = status_service_1.StatusService.mapStageToOrderStatus(stage);
    if (newStatus) {
        updateData.status = newStatus;
    }
    // Handle timestamps
    const now = new Date();
    if (stage === shared_1.DeliveryStageEnum.PICKED_UP)
        updateData.pickupAt = now;
    if (stage === shared_1.DeliveryStageEnum.DELIVERED)
        updateData.deliveredAt = now;
    const updatedOrder = await prisma.order.update({
        where: { id },
        data: updateData
    });
    // 4. Centralized Audit Log
    await audit_service_1.AuditService.record({
        userId: courierId,
        action: 'UPDATE_DELIVERY_STAGE',
        entity: 'Order',
        entityId: id,
        oldValue: { stage: currentStage },
        newValue: { stage: stage }
    });
    return reply.send(updatedOrder);
}
//# sourceMappingURL=courier.controller.js.map