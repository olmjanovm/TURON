import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, API_BASE_URL } from '../../lib/api';
import type { CategoryFormData, MenuCategory, MenuProduct, ProductFormData } from '../../features/menu/types';
import { useCartStore } from '../../store/useCartStore';
import { useToastStore } from '../../store/useToastStore';

const menuKeys = {
  all: ['menu'] as const,
  categories: ['menu', 'categories'] as const,
  products: ['menu', 'products'] as const,
  product: (id: string) => ['menu', 'product', id] as const,
  adminCategories: ['menu', 'admin', 'categories'] as const,
  adminProducts: ['menu', 'admin', 'products'] as const,
};

export const useCategories = () =>
  useQuery<MenuCategory[]>({
    queryKey: menuKeys.categories,
    queryFn: async () => (await api.get('/menu/categories')) as MenuCategory[],
  });

export const useProducts = () =>
  useQuery<MenuProduct[]>({
    queryKey: menuKeys.products,
    queryFn: async () => (await api.get('/menu/products')) as MenuProduct[],
  });

export const useProductById = (id: string) =>
  useQuery<MenuProduct>({
    queryKey: menuKeys.product(id),
    queryFn: async () => (await api.get(`/menu/products/${id}`)) as MenuProduct,
    enabled: !!id,
  });

export const useAdminCategories = () =>
  useQuery<MenuCategory[]>({
    queryKey: menuKeys.adminCategories,
    queryFn: async () => (await api.get('/menu/admin/categories')) as MenuCategory[],
  });

export const useAdminProducts = () =>
  useQuery<MenuProduct[]>({
    queryKey: menuKeys.adminProducts,
    queryFn: async () => (await api.get('/menu/admin/products')) as MenuProduct[],
  });

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CategoryFormData) => (await api.post('/menu/categories', data)) as MenuCategory,
    onSuccess: (createdCategory) => {
      queryClient.setQueryData<MenuCategory[]>(menuKeys.adminCategories, (current = []) => {
        const next = [...current.filter((category) => category.id !== createdCategory.id), createdCategory];
        return next.sort((left, right) => left.sortOrder - right.sortOrder);
      });
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CategoryFormData }) =>
      (await api.put(`/menu/categories/${id}`, data)) as MenuCategory,
    onSuccess: (updatedCategory) => {
      queryClient.setQueryData<MenuCategory[]>(menuKeys.adminCategories, (current = []) =>
        current
          .map((category) => (category.id === updatedCategory.id ? updatedCategory : category))
          .sort((left, right) => left.sortOrder - right.sortOrder),
      );
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
    },
  });
};

export const useSetCategoryActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      (await api.patch(`/menu/categories/${id}/active`, { isActive })) as MenuCategory,
    onSuccess: (updatedCategory) => {
      queryClient.setQueryData<MenuCategory[]>(menuKeys.adminCategories, (current = []) =>
        current.map((category) => (category.id === updatedCategory.id ? updatedCategory : category)),
      );
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/menu/categories/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<MenuCategory[]>(menuKeys.adminCategories, (current = []) =>
        current.filter((category) => category.id !== deletedId),
      );
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProductFormData) => (await api.post('/menu/products', data)) as MenuProduct,
    onSuccess: (createdProduct) => {
      queryClient.setQueryData<MenuProduct[]>(menuKeys.adminProducts, (current = []) => [
        createdProduct,
        ...current.filter((product) => product.id !== createdProduct.id),
      ]);
      queryClient.setQueryData(menuKeys.product(createdProduct.id), createdProduct);
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductFormData }) =>
      (await api.put(`/menu/products/${id}`, data)) as MenuProduct,
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData<MenuProduct[]>(menuKeys.adminProducts, (current = []) =>
        current.map((product) => (product.id === updatedProduct.id ? updatedProduct : product)),
      );
      queryClient.setQueryData(menuKeys.product(updatedProduct.id), updatedProduct);
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
    },
  });
};

export const useSetProductActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      (await api.patch(`/menu/products/${id}/active`, { isActive })) as MenuProduct,
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData<MenuProduct[]>(menuKeys.adminProducts, (current = []) =>
        current.map((product) => (product.id === updatedProduct.id ? updatedProduct : product)),
      );
      queryClient.setQueryData(menuKeys.product(updatedProduct.id), updatedProduct);
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/menu/products/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<MenuProduct[]>(menuKeys.adminProducts, (current = []) =>
        current.filter((product) => product.id !== deletedId),
      );
      queryClient.removeQueries({ queryKey: menuKeys.product(deletedId) });
      queryClient.invalidateQueries({ queryKey: menuKeys.all });
    },
  });
};

/**
 * Subscribes to live menu updates via SSE.
 *
 * Mount this once at the customer layout level — every menu mutation on
 * the admin side fires `menu.updated` over the `/menu/stream` SSE channel,
 * which we react to by:
 *
 *   1. Invalidating every cached menu query (`menuKeys.all` catches the
 *      products list, categories list, individual product detail
 *      (`useProductById`), and the admin lists).
 *   2. Refetching the public products list and replaying it through the
 *      cart store's `syncWithProducts()` so any item the customer is
 *      already holding gets its price/availability snapshot refreshed.
 *      If a price actually changed we surface a toast in Uzbek so the
 *      customer notices before they hit checkout.
 */
export const useMenuStream = () => {
  const queryClient = useQueryClient();
  const reconnectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let closed = false;
    let es: EventSource | null = null;

    const handleUpdate = async () => {
      // Invalidate every menu-related query in one shot.
      void queryClient.invalidateQueries({ queryKey: menuKeys.all });

      // Pull a fresh products list and replay into the cart so prices /
      // availability stay in sync across every customer page.
      try {
        const fresh = (await api.get('/menu/products')) as MenuProduct[];
        const beforeItems = useCartStore.getState().items;
        if (beforeItems.length === 0) return;

        const freshById = new Map(fresh.map((p) => [p.id, p]));
        const priceChanges = beforeItems
          .map((item) => {
            const product = freshById.get(item.menuItemId ?? item.id);
            if (!product) return null;
            if (Number(product.price) === Number(item.price)) return null;
            return { name: item.name, oldPrice: item.price, newPrice: product.price };
          })
          .filter((change): change is NonNullable<typeof change> => change !== null);

        useCartStore.getState().syncWithProducts(fresh);

        if (priceChanges.length > 0) {
          const first = priceChanges[0];
          const more = priceChanges.length > 1 ? ` (+${priceChanges.length - 1})` : '';
          useToastStore
            .getState()
            .addToast(
              `Narx yangilandi: ${first.name} — ${first.newPrice.toLocaleString()} so'm${more}`,
              'info',
              3500,
            );
        }
      } catch {
        // Non-critical — UI will refetch on the next React Query window
      }
    };

    const connect = () => {
      if (closed) return;
      es = new EventSource(`${API_BASE_URL}/menu/stream`);
      es.onmessage = () => {
        void handleUpdate();
      };
      es.onerror = () => {
        // EventSource auto-reconnects, but reset the source on persistent
        // failures so we don't hold a dead handle.
        if (closed) return;
        try { es?.close(); } catch { /* ignore */ }
        if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = window.setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      try { es?.close(); } catch { /* ignore */ }
    };
  }, [queryClient]);
};
