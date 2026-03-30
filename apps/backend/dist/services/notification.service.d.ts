import { Telegraf } from 'telegraf';
import { AppEventEnum } from '@turon/shared';
export interface TelegramNotificationPayload {
    chatId: string;
    orderNumber: string;
    status: string;
    total?: number;
    reason?: string;
    courierName?: string;
}
export declare class NotificationService {
    private bot;
    constructor(bot: Telegraf);
    /**
     * Universal method to send Telegram push notifications.
     * This is a foundation for real-time order tracking via the bot.
     */
    sendPushNotification(event: AppEventEnum, payload: TelegramNotificationPayload): Promise<void>;
    private getTemplate;
}
//# sourceMappingURL=notification.service.d.ts.map