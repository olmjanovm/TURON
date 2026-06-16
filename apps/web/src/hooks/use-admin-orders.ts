'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { OrderStatusEnum } from '@turon/shared';

export interface AdminOrderItem {
  name?: string;
  productName?: string;
  quantity?: number;
  price?: number;
}

/** Admin order shakli (eski Fastify /orders bilan mos kalit maydonlar). */
export interface AdminOrder {
  id: string;
  orderNumber?: string | number;
  orderStatus: OrderStatusEnum;
  paymentMethod?: string;
  paymentStatus?: string;
  items?: AdminOrderItem[];
  subtotal?: number;
  discount?: number;
  deliveryFee?: number;
  total?: number;
  finalAmount?: number;
  totalAmount?: number;
  note?: string;
  createdAt?: string;
  customerName?: string;
  customerPhone?: string | null;
  customerAddress?: { addressText?: string; latitude?: number; longitude?: number; note?: string | null } | null;
  courierName?: string;
  cancelledByRole?: 'customer' | 'admin' | 'courier' | null;
  cancellationReason?: string | null;
}

/** GET /api/orders -> admin ro'yxati. */
export function useAdminOrders() {
  return useQuery<AdminOrder[]>({
    queryKey: ['admin', 'orders'],
    queryFn: () => apiFetch<AdminOrder[]>('/api/orders'),
    refetchInterval: 15_000,
  });
}

// ── Mijoz so'rovlari (modifications: bekor / manzil / to'lov) ───────────────
export interface OrderModification {
  id: string;
  orderId: string;
  type: 'CANCEL' | 'ADDRESS_CHANGE' | 'PAYMENT_METHOD_CHANGE' | 'OTHER';
  status: 'PENDING' | 'AUTO_APPROVED' | 'APPROVED' | 'REJECTED';
  payload: { amount?: number | null; receiptUrl?: string | null; addressText?: string | null } | null;
  reason: string | null;
  createdAt: string;
}

/** Buyurtma bo'yicha mijoz so'rovlari (admin tasdiqi uchun). */
export function useOrderModifications(orderId: string) {
  return useQuery<OrderModification[]>({
    queryKey: ['admin', 'order-mods', orderId],
    queryFn: () => apiFetch<OrderModification[]>(`/api/orders/${orderId}/modifications`),
    enabled: Boolean(orderId),
    refetchInterval: 12_000,
  });
}

export function useDecideModification(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reqId, approve }: { reqId: string; approve: boolean }) =>
      apiFetch(`/api/orders/${orderId}/modifications/${reqId}/decide`, {
        method: 'POST',
        body: JSON.stringify({ approve }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'order-mods', orderId] });
      qc.invalidateQueries({ queryKey: ['admin', 'order', orderId] });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

/** GET /api/orders/:id -> bitta buyurtma. */
export function useAdminOrder(id: string) {
  return useQuery<AdminOrder>({
    queryKey: ['admin', 'order', id],
    queryFn: () => apiFetch<AdminOrder>(`/api/orders/${id}`),
    enabled: Boolean(id),
    // Real-time'ga yaqin: mijoz bekor qilsa / holat o'zgarsa admin ko'rib turadi
    refetchInterval: 10_000,
  });
}

/** PATCH /api/orders/:id/status -> holatni o'zgartirish. */
export function useUpdateOrderStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: OrderStatusEnum) =>
      apiFetch<AdminOrder>(`/api/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'order', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

export interface CourierOption {
  id: string;
  fullName: string;
  phoneNumber?: string;
  activeAssignments: number;
  isOnline?: boolean;
  isFree?: boolean;
  etaMinutes?: number | null;
}

/** GET /api/orders/courier-options -> dispatch uchun kuryerlar. */
export function useCourierOptions(enabled: boolean) {
  return useQuery<CourierOption[]>({
    queryKey: ['admin', 'courier-options'],
    queryFn: () => apiFetch<CourierOption[]>('/api/orders/courier-options'),
    enabled,
  });
}

function useOrderInvalidate(id: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['admin', 'order', id] });
    qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
  };
}

/** POST /api/orders/:id/dispatch -> kuryer biriktirish. */
export function useDispatchOrder(id: string) {
  const invalidate = useOrderInvalidate(id);
  return useMutation({
    mutationFn: (courierId: string) =>
      apiFetch<AdminOrder>(`/api/orders/${id}/dispatch`, {
        method: 'POST',
        body: JSON.stringify({ courierId }),
      }),
    onSuccess: invalidate,
  });
}

/** PATCH /api/orders/:id/payment/approve | reject. */
export function usePaymentAction(id: string) {
  const invalidate = useOrderInvalidate(id);
  const approve = useMutation({
    mutationFn: () =>
      apiFetch<AdminOrder>(`/api/orders/${id}/payment/approve`, { method: 'PATCH' }),
    onSuccess: invalidate,
  });
  const reject = useMutation({
    mutationFn: (reason?: string) =>
      apiFetch<AdminOrder>(`/api/orders/${id}/payment/reject`, {
        method: 'PATCH',
        body: JSON.stringify(reason ? { reason } : {}),
      }),
    onSuccess: invalidate,
  });
  return { approve, reject };
}
