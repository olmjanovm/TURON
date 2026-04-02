import { ProductAvailabilityEnum, ProductBadgeEnum } from '@turon/shared';

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuProduct {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  imageUrl: string;
  isActive: boolean;
  availability: ProductAvailabilityEnum;
  stockQuantity: number;
  badge: ProductBadgeEnum;
  badgeText?: string | null;
  isFeatured?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  isDiscounted?: boolean;
  discountPercent?: number | null;
  weight?: string;
  weightText?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFormData {
  name: string;
  slug?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductFormData {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  imageUrl?: string;
  isActive: boolean;
  stockQuantity: number;
  availability?: ProductAvailabilityEnum;
  badge?: ProductBadgeEnum;
  weight?: string;
  badgeText?: string | null;
  isFeatured?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  isDiscounted?: boolean;
  discountPercent?: number | null;
  sortOrder?: number;
}

export type ProductFilterState = {
  categoryId: string;
  activeFilter: 'all' | 'active' | 'inactive';
  availabilityFilter: 'all' | ProductAvailabilityEnum;
  searchQuery: string;
};
