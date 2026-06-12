'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface MenuCategory {
  id: string;
  name: string;
  slug?: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface MenuProduct {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  oldPrice?: number | null;
  imageUrl?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  discountPercent?: number | null;
}

export function useCategories() {
  return useQuery<MenuCategory[]>({
    queryKey: ['menu', 'categories'],
    queryFn: () => apiFetch<MenuCategory[]>('/api/menu/categories'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProducts() {
  return useQuery<MenuProduct[]>({
    queryKey: ['menu', 'products'],
    queryFn: () => apiFetch<MenuProduct[]>('/api/menu/products'),
    staleTime: 5 * 60 * 1000,
  });
}
