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
  courierName?: string;
}

/** GET /api/orders -> admin ro'yxati. */
export function useAdminOrders() {
  return useQuery<AdminOrder[]>({
    queryKey: ['admin', 'orders'],
    queryFn: () => apiFetch<AdminOrder[]>('/api/orders'),
    refetchInterval: 15_000,
  });
}

/** GET /api/orders/:id -> bitta buyurtma. */
export function useAdminOrder(id: string) {
  return useQuery<AdminOrder>({
    queryKey: ['admin', 'order', id],
    queryFn: () => apiFetch<AdminOrder>(`/api/orders/${id}`),
    enabled: Boolean(id),
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
