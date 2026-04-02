import { EventEmitter } from 'node:events';

export interface CourierLocationSnapshot {
  latitude: number;
  longitude: number;
  heading?: number;
  speedKmh?: number;
  remainingDistanceKm?: number;
  remainingEtaMinutes?: number;
  updatedAt: string;
}

export interface OrderTrackingSnapshot {
  isLive: boolean;
  lastEventAt: string;
  courierLocation?: CourierLocationSnapshot;
}

export interface OrderTrackingEvent {
  type: 'snapshot' | 'order.updated' | 'courier.location';
  orderId: string;
  order?: unknown;
  tracking?: OrderTrackingSnapshot;
}

class OrderTrackingService {
  private readonly emitter = new EventEmitter();
  private readonly snapshots = new Map<string, CourierLocationSnapshot>();
  private readonly liveWindowMs = 45_000;
  private readonly globalEventName = 'order-tracking:all';

  constructor() {
    this.emitter.setMaxListeners(0);
  }

  subscribe(orderId: string, listener: (event: OrderTrackingEvent) => void) {
    const eventName = this.getEventName(orderId);
    this.emitter.on(eventName, listener);

    return () => {
      this.emitter.off(eventName, listener);
    };
  }

  subscribeAll(listener: (event: OrderTrackingEvent) => void) {
    this.emitter.on(this.globalEventName, listener);

    return () => {
      this.emitter.off(this.globalEventName, listener);
    };
  }

  publishSnapshot(orderId: string, order: unknown) {
    this.emit({
      type: 'snapshot',
      orderId,
      order,
      tracking: this.getSnapshot(orderId),
    });
  }

  publishOrderUpdate(orderId: string, order: unknown) {
    this.emit({
      type: 'order.updated',
      orderId,
      order,
      tracking: this.getSnapshot(orderId),
    });
  }

  publishCourierLocation(orderId: string, location: Omit<CourierLocationSnapshot, 'updatedAt'> & { updatedAt?: string }) {
    const snapshot: CourierLocationSnapshot = {
      ...location,
      updatedAt: location.updatedAt || new Date().toISOString(),
    };

    this.snapshots.set(orderId, snapshot);

    const tracking = this.getSnapshot(orderId);
    this.emit({
      type: 'courier.location',
      orderId,
      tracking,
    });

    return tracking;
  }

  getSnapshot(orderId: string): OrderTrackingSnapshot | undefined {
    const location = this.snapshots.get(orderId);

    if (!location) {
      return undefined;
    }

    const isLive = Date.now() - new Date(location.updatedAt).getTime() <= this.liveWindowMs;

    return {
      isLive,
      lastEventAt: location.updatedAt,
      courierLocation: location,
    };
  }

  private emit(event: OrderTrackingEvent) {
    this.emitter.emit(this.getEventName(event.orderId), event);
    this.emitter.emit(this.globalEventName, event);
  }

  private getEventName(orderId: string) {
    return `order-tracking:${orderId}`;
  }
}

export const orderTrackingService = new OrderTrackingService();
