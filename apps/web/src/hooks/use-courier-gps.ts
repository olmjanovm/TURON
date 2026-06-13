'use client';

import { useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { GpsTracker, type GpsMode, type GpsSample } from '@/lib/gps-tracker';
import { useAuth } from '@/hooks/use-auth';
import { useCourierStatus, useCourierOrders } from '@/hooks/use-courier';
import { apiFetch } from '@/lib/api-client';
import { UserRoleEnum } from '@turon/shared';

/**
 * Courier GPS emitter.
 *
 * - Active when user is COURIER + isOnline.
 * - Mode auto-derived: any ACCEPTED|PICKED_UP|DELIVERING assignment → 'active'.
 *   isOnline only → 'idle'. document.hidden → 'background'.
 * - Emit via socket; if socket disconnected, fall back to REST
 *   PATCH /courier/order/:id/location for the active order (best-effort).
 */
export function useCourierGps() {
  const { user, status } = useAuth();
  const { data: courierStatus } = useCourierStatus();
  const { data: orders } = useCourierOrders();
  const trackerRef = useRef<GpsTracker | null>(null);

  const isOnline = courierStatus?.isOnline ?? false;
  const activeOrder = (orders ?? []).find((o) =>
    ['ACCEPTED', 'PICKED_UP', 'DELIVERING'].includes(o.courierAssignmentStatus ?? ''),
  );
  const activeOrderId = activeOrder?.id ?? null;

  useEffect(() => {
    if (status !== 'authenticated' || user?.role !== UserRoleEnum.COURIER) return;
    if (!isOnline) {
      trackerRef.current?.stop();
      trackerRef.current = null;
      return;
    }

    if (!trackerRef.current) {
      trackerRef.current = new GpsTracker();
    }

    const tracker = trackerRef.current;

    const computeMode = (): GpsMode => {
      if (typeof document !== 'undefined' && document.hidden) return 'background';
      return activeOrderId ? 'active' : 'idle';
    };

    const emit = (sample: GpsSample) => {
      const socket = getSocket();
      const payload = { ...sample, orderId: activeOrderId };
      if (socket.connected) {
        socket.emit('courier:location', payload);
      } else if (activeOrderId) {
        void apiFetch(`/courier/order/${activeOrderId}/location`, {
          method: 'PATCH',
          body: JSON.stringify({
            latitude: sample.lat,
            longitude: sample.lng,
            heading: sample.heading,
            speed: sample.speed,
            accuracy: sample.accuracy,
          }),
        }).catch(() => {/* best-effort */});
      }
    };

    tracker.start({ mode: computeMode(), onSample: emit });

    const onVisibility = () => tracker.setMode(computeMode());
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      tracker.stop();
    };
  }, [user?.role, status, isOnline, activeOrderId]);

  useEffect(() => {
    return () => {
      trackerRef.current?.stop();
      trackerRef.current = null;
    };
  }, []);
}
