"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramAuthHandler = telegramAuthHandler;
const client_1 = require("@prisma/client");
const telegram_1 = require("../../utils/telegram");
const shared_1 = require("@turon/shared");
const config_1 = require("../../../config");
const audit_service_1 = require("../../../services/audit.service");
const prisma = new client_1.PrismaClient();
async function telegramAuthHandler(request, reply) {
    const { initData } = request.body;
    const botToken = config_1.env.BOT_TOKEN;
    // 1. Verify Telegram signature
    if (!(0, telegram_1.verifyTelegramWebAppData)(initData, botToken)) {
        return reply.status(401).send({ error: 'Invalid Telegram signature' });
    }
    // 2. Extract user info
    const tgUser = (0, telegram_1.parseTelegramInitData)(initData);
    if (!tgUser || !tgUser.id) {
        return reply.status(400).send({ error: 'Could not parse Telegram user' });
    }
    const telegramId = tgUser.id.toString();
    // 3. Find or Create User in DB
    let user = await prisma.user.findUnique({
        where: { telegramId },
        include: { roles: true }
    });
    if (!user) {
        // New user defaults to CUSTOMER
        user = await prisma.user.create({
            data: {
                telegramId,
                firstName: tgUser.first_name || 'User',
                lastName: tgUser.last_name,
                username: tgUser.username,
                roles: { create: { role: shared_1.UserRoleEnum.CUSTOMER } }
            },
            include: { roles: true }
        });
    }
    // 4. Determine Primary Role (Admin > Courier > Customer)
    const roleNames = user.roles.map(r => r.role);
    let primaryRole = shared_1.UserRoleEnum.CUSTOMER;
    if (roleNames.includes(shared_1.UserRoleEnum.ADMIN))
        primaryRole = shared_1.UserRoleEnum.ADMIN;
    else if (roleNames.includes(shared_1.UserRoleEnum.COURIER))
        primaryRole = shared_1.UserRoleEnum.COURIER;
    // 6. Audit Log
    await audit_service_1.AuditService.record({
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        newValue: { role: primaryRole, timestamp: new Date() }
    });
    return reply.send({
        user: {
            id: user.id,
            telegramId: user.telegramId,
            fullName: `${user.firstName} ${user.lastName || ''}`.trim(),
            phoneNumber: user.phoneNumber,
            role: primaryRole,
            language: user.language
        },
        token
    });
}
//# sourceMappingURL=auth.controller.js.map