'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface RestaurantIdentity {
  name: string;
  logoUrl: string | null;
  cardNumber: string;
}

const DEFAULT_IDENTITY: RestaurantIdentity = {
  name: 'TURON',
  logoUrl: null,
  cardNumber: '',
};

/**
 * Public restaurant identity (name + logoUrl) — customer/courier panellari uchun.
 * - Bir marta fetch, 5 daq stale (admin nomni o'zgartirsa darhol emas, lekin tez).
 * - Auth talab qilmaydi — backend /restaurant/identity public endpoint.
 * - Network/error holatida default 'TURON' fallback (UI hech qachon bo'sh ko'rinmaydi).
 */
export function useRestaurantIdentity() {
  const query = useQuery<RestaurantIdentity>({
    queryKey: ['restaurant', 'identity'],
    queryFn: () => apiFetch<RestaurantIdentity>('/restaurant/identity'),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Network kelmaguncha default qaytaramiz — UI flicker yo'q
  const identity = query.data ?? DEFAULT_IDENTITY;

  return {
    identity,
    name: identity.name,
    logoUrl: identity.logoUrl,
    cardNumber: identity.cardNumber,
    isLoading: query.isLoading,
  };
}

/**
 * Document title'ni restoran nomi bilan dinamik o'rnatadi.
 * Customer/courier layout'da bir marta chaqirish kifoya.
 *
 * @param suffix - "· Buyurtmalar" kabi sahifa nomi (ixtiyoriy)
 */
export function useRestaurantDocumentTitle(suffix?: string) {
  const { name } = useRestaurantIdentity();
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.title = suffix ? `${name} · ${suffix}` : name;
  }, [name, suffix]);
}
