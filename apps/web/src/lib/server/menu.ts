import 'server-only';
import { BACKEND_URL } from './backend';
import type { MenuCategory, MenuProduct } from '@/hooks/use-menu';

/**
 * RSC fetcher'lari — Edge'da 60s'ga keshlanadi.
 * Backend `/menu/*` `Cache-Control: max-age=60, swr=300` qaytaradi —
 * lekin asl ishonchli kesh manbai shu yerda: `next: { revalidate: 60 }`.
 *
 * Auth talab qilmaydi — public endpointlar. Header forward kerak emas.
 * Xato bo'lsa bo'sh massiv qaytadi — UI hech qachon 500'ga tushmaydi
 * (klient hook fetch'i resilient sifatida hozir ham bor).
 */

const REVALIDATE_S = 60;

export async function fetchMenuCategories(): Promise<MenuCategory[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/menu/categories`, {
      next: { revalidate: REVALIDATE_S, tags: ['menu', 'menu:categories'] },
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return [];
    return (await res.json()) as MenuCategory[];
  } catch {
    return [];
  }
}

export async function fetchMenuProducts(): Promise<MenuProduct[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/menu/products`, {
      next: { revalidate: REVALIDATE_S, tags: ['menu', 'menu:products'] },
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return [];
    return (await res.json()) as MenuProduct[];
  } catch {
    return [];
  }
}
