import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { CategoryFormData, MenuCategory, MenuProduct, ProductFormData } from '../../features/menu/types';
import { getSeedCategories, getSeedProducts } from '../../features/menu/seedData';

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
    placeholderData: () => getSeedCategories(),
  });

export const useProducts = () =>
  useQuery<MenuProduct[]>({
    queryKey: menuKeys.products,
    queryFn: async () => (await api.get('/menu/products')) as MenuProduct[],
    placeholderData: () => getSeedProducts(),
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
