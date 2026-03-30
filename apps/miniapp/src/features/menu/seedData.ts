import { ProductAvailabilityEnum, ProductBadgeEnum } from '@turon/shared';
import { MenuCategory, MenuProduct } from './types';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '../../data/mockData';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const now = new Date().toISOString();

export function getSeedCategories(): MenuCategory[] {
  return MOCK_CATEGORIES.map((c, i) => ({
    id: c.id,
    name: c.name,
    slug: slugify(c.name),
    imageUrl: c.image,
    sortOrder: i + 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }));
}

export function getSeedProducts(): MenuProduct[] {
  return MOCK_PRODUCTS.map((p, i) => ({
    id: p.id,
    categoryId: p.categoryId,
    name: p.name,
    description: p.description,
    price: p.price,
    imageUrl: p.image,
    isActive: true,
    availability: ProductAvailabilityEnum.AVAILABLE,
    stockQuantity: 100,
    badge: ProductBadgeEnum.NONE,
    sortOrder: i + 1,
    createdAt: now,
    updatedAt: now,
  }));
}
