"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const shared_1 = require("@turon/shared");
class NotificationService {
    bot;
    constructor(bot) {
        this.bot = bot;
    }
    /**
     * Universal method to send Telegram push notifications.
     * This is a foundation for real-time order tracking via the bot.
     */
    async sendPushNotification(event, payload) {
        const message = this.getTemplate(event, payload);
        if (!message)
            return;
        try {
            await this.bot.telegram.sendMessage(payload.chatId, message, {
                parse_mode: 'HTML',
            });
            console.log(`[Bot Notification] Sent ${event} to ${payload.chatId}`);
        }
        catch (error) {
            console.error(`[Bot Notification] Failed to send ${event}:`, error);
        }
    }
    getTemplate(event, payload) {
        switch (event) {
            case shared_1.AppEventEnum.ORDER_CREATED:
                return `✅ <b>Buyurtma qabul qilindi!</b>\n\nSizning #${payload.orderNumber} buyurtmangiz muvaffaqiyatli qabul qilindi. Tez orada admin tasdiqlaydi.`;
            case shared_1.AppEventEnum.ORDER_CONFIRMED:
                return `👨‍🍳 <b>Buyurtma tasdiqlandi!</b>\n\nSizning #${payload.orderNumber} buyurtmangiz tasdiqlandi va tayyorlanmoqda.`;
            case shared_1.AppEventEnum.PAYMENT_VERIFIED:
                return `💰 <b>To'lov tasdiqlandi!</b>\n\n#${payload.orderNumber} buyurtma uchun to'lov muvaffaqiyatli qabul qilindi. Rahmat!`;
            case shared_1.AppEventEnum.COURIER_ASSIGNED:
                return `🚚 <b>Kuryer yo'lda!</b>\n\nSizning #${payload.orderNumber} buyurtmangiz kuryer ${payload.courierName}ga topshirildi.`;
            case shared_1.AppEventEnum.ORDER_DELIVERED:
                return `🥗 <b>Yoqimli ishtaha!</b>\n\n#${payload.orderNumber} buyurtma muvaffaqiyatli yetkazildi. Bizni tanlaganingiz uchun rahmat!`;
            case shared_1.AppEventEnum.ORDER_CANCELLED:
                return `❌ <b>Buyurtma bekor qilindi</b>\n\nSizning #${payload.orderNumber} buyurtmangiz bekor qilindi.\nSabab: ${payload.reason || 'Noma\'lum'}`;
            default:
                return null;
        }
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notification.service.js.map