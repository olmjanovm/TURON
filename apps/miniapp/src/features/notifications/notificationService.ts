import { eventBus } from './eventBus';
import { getNotificationTemplate } from './notificationTemplates';
import { useNotificationStore } from '../../store/useNotificationStore';
import { AppNotification } from './notificationTypes';

import { AppEventEnum } from '@turon/shared';

export const initNotificationService = () => {
  // Subscribe to ALL events defined in the shared package
  Object.values(AppEventEnum).forEach((event) => {
    eventBus.subscribe(event, (evt, payload) => {
      const templates = getNotificationTemplate(evt, payload);
      
      templates.forEach((template) => {
        let actionRoute = undefined;
        if (payload.orderId) {
          if (template.roleTarget === 'CUSTOMER') actionRoute = `/customer/orders/${payload.orderId}`;
          if (template.roleTarget === 'ADMIN') actionRoute = `/admin/orders/${payload.orderId}`;
          if (template.roleTarget === 'COURIER') actionRoute = `/courier/order/${payload.orderId}`;
        }

        const notification: AppNotification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          roleTarget: template.roleTarget,
          type: template.type,
          event: evt,
          title: template.title,
          message: template.message,
          relatedOrderId: payload.orderId,
          isRead: false,
          createdAt: new Date().toISOString(),
          actionRoute
        };

        useNotificationStore.getState().addNotification(notification);
        
        // Console log for "real-time" visibility during development
        console.log(`[Notification Center] ${template.roleTarget}: ${template.title}`);
      });
    });
  });
};
