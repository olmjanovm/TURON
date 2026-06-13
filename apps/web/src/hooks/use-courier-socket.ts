'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/hooks/use-auth';
import { UserRoleEnum } from '@turon/shared';

/**
 * Real-time hook for couriers.
 * - Connects only when authenticated as COURIER.
 * - Listens for `assignment:new`, `assignment:cancelled`, `order:updated`,
 *   `tracking:position` and invalidates the matching react-query caches.
 * - Exposes `isConnected` + `lastEventAt` for UI badges.
 */
export function useCourierSocket() {
  const qc = useQueryClient();
  const { user, status } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);
  const lastConnectedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || user?.role !== UserRoleEnum.COURIER) return;

    const socket = getSocket();

    const onConnect = () => {
      setIsConnected(true);
      const prev = lastConnectedAtRef.current;
      lastConnectedAtRef.current = Date.now();
      // After reconnect — catch up via REST in case events were missed
      if (prev != null) {
        qc.invalidateQueries({ queryKey: ['courier'] });
      }
    };

    const onDisconnect = () => setIsConnected(false);

    const onAssignmentNew = (payload: { orderId?: string }) => {
      setLastEventAt(Date.now());
      qc.invalidateQueries({ queryKey: ['courier', 'orders'] });
      qc.invalidateQueries({ queryKey: ['courier', 'status'] });
      if (payload?.orderId) {
        qc.invalidateQueries({ queryKey: ['courier', 'order', payload.orderId] });
      }
    };

    const onAssignmentCancelled = (payload: { orderId?: string }) => {
      setLastEventAt(Date.now());
      qc.invalidateQueries({ queryKey: ['courier', 'orders'] });
      if (payload?.orderId) {
        qc.invalidateQueries({ queryKey: ['courier', 'order', payload.orderId] });
      }
    };

    const onOrderUpdated = (payload: { orderId?: string }) => {
      setLastEventAt(Date.now());
      if (payload?.orderId) {
        qc.invalidateQueries({ queryKey: ['courier', 'order', payload.orderId] });
      }
      qc.invalidateQueries({ queryKey: ['courier', 'orders'] });
    };

    const onTracking = (_payload: unknown) => {
      // Reserved for admin/customer side. No-op for courier.
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('assignment:new', onAssignmentNew);
    socket.on('assignment:cancelled', onAssignmentCancelled);
    socket.on('order:updated', onOrderUpdated);
    socket.on('tracking:position', onTracking);

    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('assignment:new', onAssignmentNew);
      socket.off('assignment:cancelled', onAssignmentCancelled);
      socket.off('order:updated', onOrderUpdated);
      socket.off('tracking:position', onTracking);
    };
  }, [qc, user?.role, status]);

  return { isConnected, lastEventAt };
}
