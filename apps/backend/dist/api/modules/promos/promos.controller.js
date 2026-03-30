"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePromoCode = validatePromoCode;
exports.getAllPromos = getAllPromos;
exports.handleCreatePromo = handleCreatePromo;
const client_1 = require("@prisma/client");
const audit_service_1 = require("../../../services/audit.service");
const prisma = new client_1.PrismaClient();
async function validatePromoCode(request, reply) {
    const { code } = request.body;
    const promo = await prisma.promoCode.findUnique({
        where: { code: code.toUpperCase(), isActive: true }
    });
    if (!promo) {
        return reply.status(404).send({ isValid: false, message: 'Promokod topilmadi' });
    }
    const now = new Date();
    if (now > promo.endDate) {
        return reply.status(400).send({ isValid: false, message: 'Promokod muddati tugagan' });
    }
    if (promo.usageLimit && promo.timesUsed >= promo.usageLimit) {
        return reply.status(400).send({ isValid: false, message: 'Promokod limiti tugagan' });
    }
    return reply.send({
        isValid: true,
        promo: {
            id: promo.id,
            code: promo.code,
            discountType: promo.discountType,
            discountValue: Number(promo.discountValue),
            minOrderValue: Number(promo.minOrderValue)
        }
    });
}
async function getAllPromos(request, reply) {
    const promos = await prisma.promoCode.findMany({
        orderBy: { createdAt: 'desc' }
    });
    return reply.send(promos);
}
async function handleCreatePromo(request, reply) {
    const admin = request.user;
    const data = request.body;
    const promo = await prisma.promoCode.create({
        data: {
            code: data.code,
            discountType: data.discountType,
            discountValue: data.discountValue,
            minOrderValue: data.minOrderValue,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            usageLimit: data.usageLimit
        }
    });
    await audit_service_1.AuditService.record({
        userId: admin.id,
        action: 'CREATE_PROMO',
        entity: 'PromoCode',
        entityId: promo.id,
        newValue: promo
    });
    return reply.status(201).send(promo);
}
//# sourceMappingURL=promos.controller.js.map