import type { Order } from '../data/types';

// Industry reference: Yandex Eats 15min PENDING, Uber Eats 10-15min, Uzum 30min.
// This app uses a manual admin flow, so the threshold is longer.
//
// Per product feedback: orders older than 3 hours regardless of status (other
// than DELIVERED / CANCELLED) drop into the "Eskirgan" bucket at the bottom
// of the admin list so fresh work stays at the top.
export const STALE_HOURS = 3;
export const STALE_PENDING_MS = STALE_HOURS * 60 * 60 * 1000;
export const STALE_ACTIVE_MS = STALE_HOURS * 60 * 60 * 1000;
export const STALE_NOTIFICATION_MS = STALE_HOURS * 60 * 60 * 1000;

const STALE_THRESHOLD_BY_STATUS: Partial<Record<string, number>> = {
  PENDING: STALE_PENDING_MS,
  PREPARING: STALE_ACTIVE_MS,
  READY_FOR_PICKUP: STALE_ACTIVE_MS,
  DELIVERING: STALE_ACTIVE_MS,
};

export function isOrderStale(order: Order): boolean {
  const threshold = STALE_THRESHOLD_BY_STATUS[order.orderStatus];
  if (!threshold) return false; // DELIVERED, CANCELLED are terminal — never stale
  return Date.now() - new Date(order.createdAt).getTime() > threshold;
}

export function getStaleAgeLabel(order: Order): string {
  const ageMs = Date.now() - new Date(order.createdAt).getTime();
  const hours = Math.floor(ageMs / (60 * 60 * 1000));
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days} kun oldin`;
  return `${hours} soat oldin`;
}

export function isNotificationStale(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() > STALE_NOTIFICATION_MS;
}
