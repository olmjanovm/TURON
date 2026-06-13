'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { MenuCategory, MenuProduct } from './use-menu';

/** Admin menyu — kategoriyalar (faol+nofaol). */
export function useAdminCategories() {
  return useQuery<MenuCategory[]>({
    queryKey: ['admin', 'categories'],
    queryFn: () => apiFetch<MenuCategory[]>('/api/menu/admin/categories'),
  });
}

/** Bitta mahsulot (edit uchun). */
export function useProduct(id: string) {
  return useQuery<MenuProduct>({
    queryKey: ['admin', 'product', id],
    queryFn: () => apiFetch<MenuProduct>(`/api/menu/products/${id}`),
    enabled: Boolean(id),
  });
}

export interface ProductPayload {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  oldPrice?: number | null;
  imageUrl?: string;
  isActive: boolean;
  stockQuantity: number;
  isNew?: boolean;
  isPopular?: boolean;
  isFeatured?: boolean;
}

function useCatalogInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    qc.invalidateQueries({ queryKey: ['menu', 'products'] });
  };
}

/** Yaratish (POST) yoki yangilash (PUT) — id bo'lsa update. */
export function useSaveProduct(id?: string) {
  const invalidate = useCatalogInvalidate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductPayload) =>
      id
        ? apiFetch<MenuProduct>(`/api/menu/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })
        : apiFetch<MenuProduct>('/api/menu/products', {
            method: 'POST',
            body: JSON.stringify(payload),
          }),
    onSuccess: () => {
      invalidate();
      if (id) qc.invalidateQueries({ queryKey: ['admin', 'product', id] });
    },
  });
}

/** Faol/nofaol almashtirish. */
export function useToggleProduct() {
  const invalidate = useCatalogInvalidate();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiFetch<MenuProduct>(`/api/menu/products/${id}/active`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: invalidate,
  });
}

/** O'chirish. */
export function useDeleteProduct() {
  const invalidate = useCatalogInvalidate();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/menu/products/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}

/** Admin menyu — mahsulotlar (faol+nofaol). */
export function useAdminProducts() {
  return useQuery<MenuProduct[]>({
    queryKey: ['admin', 'products'],
    queryFn: () => apiFetch<MenuProduct[]>('/api/menu/admin/products'),
  });
}

function useCategoryInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
    qc.invalidateQueries({ queryKey: ['menu', 'categories'] });
  };
}

export interface CategoryPayload {
  name: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive: boolean;
}

export function useSaveCategory(id?: string) {
  const invalidate = useCategoryInvalidate();
  return useMutation({
    mutationFn: (payload: CategoryPayload) =>
      id
        ? apiFetch<MenuCategory>(`/api/menu/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : apiFetch<MenuCategory>('/api/menu/categories', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useCategoryInvalidate();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/menu/categories/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
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

export interface PromoPayload {
  code: string;
  title?: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number;
  usageLimit?: number;
  isActive: boolean;
  isFirstOrderOnly: boolean;
  startDate?: string;
  endDate?: string | null;
}

export function useSavePromo(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PromoPayload) =>
      id
        ? apiFetch<AdminPromo>(`/api/promos/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : apiFetch<AdminPromo>('/api/promos', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'promos'] }),
  });
}

export function useDeletePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/promos/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'promos'] }),
  });
}
