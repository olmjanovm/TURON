'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface CourierOrder {
  id: string;
  orderNumber: string | null;
  orderStatus: string;
  totalAmount: number;
  deliveryFee: number;
  deliveryAddress: string | null;
  customer?: { fullName: string; phoneNumber?: string | null };
  items?: { name: string; quantity: number }[];
  createdAt: string;
}

export interface CourierStatus {
  isOnline: boolean;
  activeOrderId: string | null;
}

export interface CourierStats {
  deliveriesCompleted: number;
  totalEarnings: number;
  averageDeliveryTime: number | null;
}

export function useCourierOrders() {
  return useQuery<CourierOrder[]>({
    queryKey: ['courier', 'orders'],
    queryFn: () => apiFetch('/courier/orders'),
    refetchInterval: 15_000,
  });
}

export function useCourierStatus() {
  return useQuery<CourierStatus>({
    queryKey: ['courier', 'status'],
    queryFn: () => apiFetch('/courier/me/status'),
    refetchInterval: 30_000,
  });
}

export function useCourierStats() {
  return useQuery<CourierStats>({
    queryKey: ['courier', 'stats'],
    queryFn: () => apiFetch('/courier/stats/today'),
  });
}

export function useUpdateCourierStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isOnline: boolean) =>
      apiFetch('/courier/me/status', {
        method: 'PATCH',
        body: JSON.stringify({ isOnline }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courier', 'status'] }),
  });
}

export function useAcceptOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      apiFetch(`/courier/order/${orderId}/accept`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courier'] }),
  });
}

export function useOrderAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, action }: { orderId: string; action: string }) =>
      apiFetch(`/courier/order/${orderId}/${action}`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courier'] }),
  });
}
