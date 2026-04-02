import { AppEventEnum } from '@turon/shared';
import { eventBus } from './eventBus';
import { EventPayload } from './notificationTypes';

export const triggerNotification = (event: AppEventEnum, payload: Partial<EventPayload>) => {
  const fullPayload: EventPayload = {
    timestamp: new Date().toISOString(),
    ...payload
  };

  eventBus.publish(event, fullPayload);
};

// --- Specialized Triggers for Common Actions ---

export const notifyOrderCreated = (orderId: string, orderNumber: string, total: number) => {
  triggerNotification(AppEventEnum.ORDER_CREATED, { orderId, orderNumber, total });
};

export const notifyOrderConfirmed = (orderId: string, orderNumber: string) => {
  triggerNotification(AppEventEnum.ORDER_CONFIRMED, { orderId, orderNumber });
};

export const notifyPaymentVerified = (orderId: string, orderNumber: string) => {
  triggerNotification(AppEventEnum.PAYMENT_VERIFIED, { orderId, orderNumber });
};

export const notifyPaymentFailed = (orderId: string, orderNumber: string, reason?: string) => {
  triggerNotification(AppEventEnum.PAYMENT_FAILED, { orderId, orderNumber, reason });
};

export const notifyCourierAssigned = (orderId: string, orderNumber: string, courierName: string) => {
  triggerNotification(AppEventEnum.COURIER_ASSIGNED, { orderId, orderNumber, courierName });
};

export const notifyOrderDelivered = (orderId: string, orderNumber: string) => {
  triggerNotification(AppEventEnum.ORDER_DELIVERED, { orderId, orderNumber });
};

export const notifyOrderCancelled = (orderId: string, orderNumber: string, reason: string) => {
  triggerNotification(AppEventEnum.ORDER_CANCELLED, { orderId, orderNumber, reason });
};
