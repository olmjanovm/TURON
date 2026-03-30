import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export const useCategories = () => {
  return useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/menu/categories'),
  });
};

export const useProducts = () => {
  return useQuery<any[]>({
    queryKey: ['products'],
    queryFn: () => api.get('/menu/products'),
  });
};

export const useProductById = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get(`/menu/products/${id}`),
    enabled: !!id,
  });
};
