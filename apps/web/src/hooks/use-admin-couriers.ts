'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface AdminCourier {
  id: string;
  telegramId: string;
  fullName: string;
  phoneNumber?: string | null;
  isActive: boolean;
  isOnline: boolean;
  isAcceptingOrders: boolean;
  activeAssignments: number;
  completedToday: number;
  totalDelivered: number;
  deliveryFeesToday: number;
}

export function useCouriers() {
  return useQuery<AdminCourier[]>({
    queryKey: ['admin', 'couriers'],
    queryFn: () => apiFetch<AdminCourier[]>('/api/couriers/admin'),
    refetchInterval: 20_000,
  });
}

export function useToggleCourier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiFetch<AdminCourier>(`/api/couriers/admin/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'couriers'] }),
  });
}

export function useUpdateCourier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; fullName?: string; phoneNumber?: string; isActive?: boolean }) =>
      apiFetch<AdminCourier>(`/api/couriers/admin/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'couriers'] }),
  });
}

export function useCreateCourier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      telegramId: string;
      fullName: string;
      phoneNumber?: string;
      isActive: boolean;
    }) =>
      apiFetch<AdminCourier>('/api/couriers/admin', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'couriers'] }),
  });
}
