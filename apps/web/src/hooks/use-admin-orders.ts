'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { OrderStatusEnum } from '@turon/shared';

/** Minimal admin order shakli (faqat dashboard uchun kerakli maydonlar). */
export interface AdminOrder {
  id: string;
  orderStatus: OrderStatusEnum;
  finalAmount?: number;
  totalAmount?: number;
  createdAt?: string;
  orderNumber?: string | number;
}

/** GET /api/orders -> eski Fastify /orders (admin ro'yxati) proxy orqali. */
export function useAdminOrders() {
  return useQuery<AdminOrder[]>({
    queryKey: ['admin', 'orders'],
    queryFn: () => apiFetch<AdminOrder[]>('/api/orders'),
    refetchInterval: 15_000, // jonli yangilanish
  });
}
