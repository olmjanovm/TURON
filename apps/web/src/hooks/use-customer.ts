'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

// ── Types ────────────────────────────────────────────────────────────────
export interface Address {
  id: string;
  label: string;
  addressText: string;
  landmark?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  createdAt: string;
}

export interface CustomerOrderItem {
  id: string;
  productId: string;
  name: string;
  imageUrl?: string;
  price: number;
  quantity: number;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentMethod: string;
  total: number;
  deliveryFee: number;
  discountAmount?: number;
  items: CustomerOrderItem[];
  customerAddress?: { addressText?: string | null } | null;
  deliveryAddress?: string | null;
  note?: string | null;
  createdAt: string;
  deliveredAt?: string | null;
  courier?: { id: string; fullName: string; phoneNumber?: string | null } | null;
  tracking?: { courierLocation?: { latitude: number; longitude: number } } | null;
}

export interface QuoteInput {
  items: { productId: string; quantity: number }[];
  addressId?: string;
  promoCode?: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
}

export interface QuoteResult {
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  promoValid?: boolean;
  promoMessage?: string;
}

export interface CreateOrderInput extends QuoteInput {
  note?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// ── Addresses ────────────────────────────────────────────────────────────
export function useAddresses() {
  return useQuery<Address[]>({
    queryKey: ['customer', 'addresses'],
    queryFn: () => apiFetch('/addresses'),
    staleTime: 30_000,
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Address, 'id' | 'createdAt'>) =>
      apiFetch<Address>('/addresses', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'addresses'] }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Address> }) =>
      apiFetch<Address>(`/addresses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'addresses'] }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/addresses/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'addresses'] }),
  });
}

// ── Orders ───────────────────────────────────────────────────────────────
export function useMyOrders() {
  return useQuery<CustomerOrder[]>({
    queryKey: ['customer', 'orders'],
    queryFn: () => apiFetch('/orders/my'),
    refetchInterval: 10_000,
  });
}

export function useOrderDetail(orderId: string | undefined) {
  return useQuery<CustomerOrder>({
    queryKey: ['customer', 'order', orderId],
    queryFn: () => apiFetch(`/orders/${orderId}`),
    enabled: !!orderId,
    refetchInterval: 8_000,
  });
}

export function useQuoteOrder() {
  return useMutation({
    mutationFn: (input: QuoteInput) =>
      apiFetch<QuoteResult>('/orders/quote', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => {
      const idempotencyKey = crypto.randomUUID();
      return apiFetch<CustomerOrder>('/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'orders'] }),
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      apiFetch(`/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer'] }),
  });
}

// ── Promo ────────────────────────────────────────────────────────────────
export function useValidatePromo() {
  return useMutation({
    mutationFn: (code: string) =>
      apiFetch<{ valid: boolean; message?: string; discountPercent?: number; discountAmount?: number }>(
        '/promos/validate',
        { method: 'POST', body: JSON.stringify({ code }) },
      ),
  });
}

// ── Notifications ────────────────────────────────────────────────────────
export function useNotifications() {
  return useQuery<NotificationItem[]>({
    queryKey: ['customer', 'notifications'],
    queryFn: () => apiFetch('/notifications/my'),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/notifications/${id}/read`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'notifications'] }),
  });
}

// ── Profile ──────────────────────────────────────────────────────────────
export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: { fullName?: string; phoneNumber?: string }) =>
      apiFetch('/customers/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer'] }),
  });
}

// ── Status helpers ───────────────────────────────────────────────────────
export const ORDER_STATUS_META: Record<
  string,
  { dot: string; chip: string; bar: string }
> = {
  PENDING:          { dot: 'bg-amber-500',   chip: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',     bar: 'bg-amber-400' },
  PREPARING:        { dot: 'bg-sky-500',     chip: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',             bar: 'bg-sky-400' },
  READY_FOR_PICKUP: { dot: 'bg-violet-500',  chip: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300', bar: 'bg-violet-400' },
  DELIVERING:       { dot: 'bg-blue-500',    chip: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',         bar: 'bg-blue-400' },
  DELIVERED:        { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', bar: 'bg-emerald-400' },
  CANCELLED:        { dot: 'bg-red-500',     chip: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',             bar: 'bg-red-400' },
};
