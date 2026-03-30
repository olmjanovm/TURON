"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAddresses = getAddresses;
exports.handleCreateAddress = handleCreateAddress;
exports.handleDeleteAddress = handleDeleteAddress;
const client_1 = require("@prisma/client");
const audit_service_1 = require("../../../services/audit.service");
const prisma = new client_1.PrismaClient();
async function getAddresses(request, reply) {
    const user = request.user;
    const addresses = await prisma.deliveryAddress.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
    });
    return reply.send(addresses);
}
async function handleCreateAddress(request, reply) {
    const user = request.user;
    const data = request.body;
    const address = await prisma.deliveryAddress.create({
        data: {
            userId: user.id,
            title: data.title || 'Manzil',
            address: data.address,
            latitude: data.latitude,
            longitude: data.longitude
        }
    });
    await audit_service_1.AuditService.record({
        userId: user.id,
        action: 'CREATE_ADDRESS',
        entity: 'DeliveryAddress',
        entityId: address.id,
        newValue: address
    });
    return reply.status(201).send(address);
}
async function handleDeleteAddress(request, reply) {
    const user = request.user;
    const { id } = request.params;
    const address = await prisma.deliveryAddress.findUnique({
        where: { id }
    });
    if (!address || address.userId !== user.id) {
        return reply.status(403).send({ error: 'Ruxsat etilmadi' });
    }
    await prisma.deliveryAddress.delete({ where: { id } });
    await audit_service_1.AuditService.record({
        userId: user.id,
        action: 'DELETE_ADDRESS',
        entity: 'DeliveryAddress',
        entityId: id,
        oldValue: address
    });
    return reply.status(204).send();
}
//# sourceMappingURL=addresses.controller.js.map