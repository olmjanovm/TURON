'use client';

import { useCourierSocket } from '@/hooks/use-courier-socket';
import { useCourierGps } from '@/hooks/use-courier-gps';

/**
 * Activator component — mount once in CourierLayout.
 * - Opens the Socket.io connection
 * - Listens for assignment / order events and invalidates react-query
 * - Starts GPS emission when courier is online
 *
 * Returns null — purely an effect. UI badges read connection state via
 * `useCourierSocket()` directly inside header components.
 */
export function CourierRealtime() {
  useCourierSocket();
  useCourierGps();
  return null;
}
