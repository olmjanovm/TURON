'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface AppNotification {
  id: string;
  type?: string;
  title: string;
  message: string;
  relatedOrderId?: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  return useQuery<AppNotification[]>({
    queryKey: ['admin', 'notifications'],
    queryFn: () => apiFetch<AppNotification[]>('/api/notifications/my'),
    refetchInterval: 20_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'notifications'] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch('/api/notifications/read-all', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'notifications'] }),
  });
}
