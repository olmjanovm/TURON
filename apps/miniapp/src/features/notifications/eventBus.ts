import { AppEventEnum } from '@turon/shared';
import { EventPayload, EventSubscriber } from './notificationTypes';

class EventBus {
  private subscribers: Map<AppEventEnum, Set<EventSubscriber>> = new Map();

  subscribe(event: AppEventEnum, callback: EventSubscriber) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)?.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(event)?.delete(callback);
    };
  }

  publish(event: AppEventEnum, payload: EventPayload) {
    if (this.subscribers.has(event)) {
      this.subscribers.get(event)?.forEach((callback) => {
        try {
          callback(event, payload);
        } catch (error) {
          console.error(`Error in subscriber for event ${event}:`, error);
        }
      });
    }
  }
}

export const eventBus = new EventBus();
