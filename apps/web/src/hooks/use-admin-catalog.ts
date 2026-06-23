'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';
import type { MenuCategory, MenuProduct } from './use-menu';

/** DELETE — 404 ("allaqachon o'chgan") ham MUVAFFAQIYAT (idempotent, soxta xato yo'q). */
async function deleteIdempotent(path: string): Promise<void> {
  try {
    await apiFetch(path, { method: 'DELETE' });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return;
    throw e;
  }
}

/** Admin menyu — kategoriyalar (faol+nofaol). */
export function useAdminCategories() {
  return useQuery<MenuCategory[]>({
    queryKey: ['admin', 'categories'],
    queryFn: () => apiFetch<MenuCategory[]>('/api/menu/admin/categories'),
  });
}

/** Bitta mahsulot (edit uchun) — ADMIN filtrsiz endpoint (inaktiv/tugagan taomni ham
 *  ochadi; public /products/:id inaktivda 404 "topilmadi" berardi — bug). */
export function useProduct(id: string) {
  return useQuery<MenuProduct>({
    queryKey: ['admin', 'product', id],
    queryFn: () => apiFetch<MenuProduct>(`/api/menu/admin/products/${id}`),
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

/** O'chirish — HARD delete (backend butunlay o'chiradi). Cache'dan ham tozalaymiz. */
export function useDeleteProduct() {
  const invalidate = useCatalogInvalidate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteIdempotent(`/api/menu/products/${id}`),
    // OPTIMISTIC: ro'yxatdan DARHOL olib tashlaymiz (ekranda osilib qolmasin).
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['admin', 'products'] });
      const prev = qc.getQueryData<MenuProduct[]>(['admin', 'products']);
      qc.setQueryData<MenuProduct[]>(['admin', 'products'], (old) =>
        (old ?? []).filter((p) => p.id !== id),
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['admin', 'products'], ctx.prev);
    },
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: ['admin', 'product', id] }); // detal cache'ini ham o'chir
    },
    onSettled: () => invalidate(),
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
  // Backend CategorySchema 'iconUrl' kutadi (imageUrl emas) — read'da imageUrl qaytadi
  iconUrl?: string;
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
    mutationFn: (id: string) => deleteIdempotent(`/api/menu/categories/${id}`),
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
    mutationFn: (id: string) => deleteIdempotent(`/api/promos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'promos'] }),
  });
}
