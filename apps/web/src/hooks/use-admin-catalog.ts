'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { MenuCategory, MenuProduct } from './use-menu';

/** Admin menyu — kategoriyalar (faol+nofaol). */
export function useAdminCategories() {
  return useQuery<MenuCategory[]>({
    queryKey: ['admin', 'categories'],
    queryFn: () => apiFetch<MenuCategory[]>('/api/menu/admin/categories'),
  });
}

/** Admin menyu — mahsulotlar (faol+nofaol). */
export function useAdminProducts() {
  return useQuery<MenuProduct[]>({
    queryKey: ['admin', 'products'],
    queryFn: () => apiFetch<MenuProduct[]>('/api/menu/admin/products'),
  });
}

export interface AdminPromo {
  id: string;
  code: string;
  title?: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number;
  startDate: string;
  endDate?: string;
  usageLimit?: number;
  timesUsed: number;
  isActive: boolean;
  isFirstOrderOnly: boolean;
}

export function useAdminPromos() {
  return useQuery<AdminPromo[]>({
    queryKey: ['admin', 'promos'],
    queryFn: () => apiFetch<AdminPromo[]>('/api/promos'),
  });
}
