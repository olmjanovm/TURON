"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCreateOrder = handleCreateOrder;
exports.getMyOrders = getMyOrders;
exports.getOrderDetail = getOrderDetail;
exports.handleUpdateStatus = handleUpdateStatus;
exports.handleAssignCourier = handleAssignCourier;
const client_1 = require("@prisma/client");
const shared_1 = require("@turon/shared");
const status_service_1 = require("../../../services/status.service");
const audit_service_1 = require("../../../services/audit.service");
const prisma = new client_1.PrismaClient();
async function handleCreateOrder(request, reply) {
    const user = request.user;
    const { items, deliveryAddressId, paymentMethod, promoCode } = request.body;
    // 1. Validate items and availability
    const dbItems = await prisma.menuItem.findMany({
        where: { id: { in: items.map((i) => i.menuItemId) }, isActive: true }
    });
    if (dbItems.length !== items.length) {
        return reply.status(400).send({ error: 'Ba`zi taomlar ochirilgan yoki topilmadi' });
    }
    // 2. Calculate totals on backend
    let subtotal = 0;
    const orderItemsData = items.map((i) => {
        const dbItem = dbItems.find(d => d.id === i.menuItemId);
        const price = Number(dbItem.price);
        subtotal += price * i.quantity;
        return {
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            priceAtOrder: dbItem.price
        };
    });
    // 3. Handle Promo (Backend Validation)
    let discountAmount = 0;
    let promoId = null;
    if (promoCode) {
        const promo = await prisma.promoCode.findUnique({
            where: { code: promoCode.toUpperCase(), isActive: true }
        });
        if (promo && new Date() <= promo.endDate && subtotal >= Number(promo.minOrderValue)) {
            promoId = promo.id;
            if (promo.discountType === 'PERCENTAGE') {
                discountAmount = (subtotal * Number(promo.discountValue)) / 100;
            }
            else {
                discountAmount = Number(promo.discountValue);
            }
        }
    }
    const deliveryFee = 15000; // Hardcoded foundation
    const totalAmount = subtotal - discountAmount + deliveryFee;
    // 4. Create Order + OrderItems (Transaction)
    const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
            data: {
                userId: user.id,
                status: shared_1.OrderStatusEnum.PENDING,
                deliveryStage: shared_1.DeliveryStageEnum.IDLE,
                subtotal,
                discountAmount,
                deliveryFee,
                totalAmount,
                paymentMethod,
                paymentStatus: shared_1.PaymentStatusEnum.PENDING,
                deliveryAddressId,
                promoCodeId: promoId,
                items: { create: orderItemsData }
            }
        });
        // Clear cart if needed
        await tx.cartItem.deleteMany({
            where: { cart: { userId: user.id } }
        });
        return newOrder;
    });
    // 5. Audit Log
    await audit_service_1.AuditService.record({
        userId: user.id,
        action: 'CREATE_ORDER',
        entity: 'Order',
        entityId: order.id,
        newValue: order
    });
    return reply.status(201).send(order);
}
async function getMyOrders(request, reply) {
    const user = request.user;
    const orders = await prisma.order.findMany({
        where: { userId: user.id },
        include: { items: { include: { menuItem: true } } },
        orderBy: { createdAt: 'desc' }
    });
    return reply.send(orders);
}
async function getOrderDetail(request, reply) {
    const order = await prisma.order.findUnique({
        where: { id: request.params.id },
        include: {
            user: true,
            items: { include: { menuItem: true } },
            deliveryAddress: true,
            courierAssignments: { include: { courier: true } }
        }
    });
    if (!order)
        return reply.status(404).send({ error: 'Buyurtma topilmadi' });
    return reply.send(order);
}
async function handleUpdateStatus(request, reply) {
    const admin = request.user;
    const { status } = request.body;
    const order = await prisma.order.findUnique({ where: { id: request.params.id } });
    if (!order)
        return reply.status(404).send({ error: 'Buyurtma topilmadi' });
    // Status transition validation
    if (!status_service_1.StatusService.validateOrderStatusTransition(order.status, status)) {
        return reply.status(400).send({
            error: `Statusni ozgartirib bolmaydi: ${order.status} -> ${status}`
        });
    }
    const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { status }
    });
    await audit_service_1.AuditService.recordStatusChange({
        userId: admin.id,
        entity: 'Order',
        entityId: order.id,
        from: order.status,
        to: status
    });
    return reply.send(updatedOrder);
}
async function handleAssignCourier(request, reply) {
    const admin = request.user;
    const { courierId } = request.body;
    const assignment = await prisma.courierAssignment.create({
        data: {
            orderId: request.params.id,
            courierId,
            status: shared_1.CourierAssignmentStatusEnum.ASSIGNED
        }
    });
    await audit_service_1.AuditService.record({
        userId: admin.id,
        action: 'ASSIGN_COURIER',
        entity: 'CourierAssignment',
        entityId: assignment.id,
        newValue: assignment
    });
    return reply.send(assignment);
}
//# sourceMappingURL=orders.controller.js.map