'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export interface WorkingHoursDay {
  open: string;
  close: string;
  closed: boolean;
}
export type WorkingHours = Record<DayKey, WorkingHoursDay>;

export interface RestaurantSettings {
  name: string;
  phone: string;
  addressText: string;
  longitude: number;
  latitude: number;
  workingHours: WorkingHours;
  isOpen: boolean;
  autoSchedule: boolean;
  logoUrl?: string | null;
  cardNumber: string;
}

export function useRestaurantSettings() {
  return useQuery<RestaurantSettings>({
    queryKey: ['admin', 'restaurant'],
    queryFn: () => apiFetch<RestaurantSettings>('/api/admin/restaurant/settings'),
  });
}

export function useSaveRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<RestaurantSettings>) =>
      apiFetch<RestaurantSettings>('/api/admin/restaurant/settings', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    onSuccess: () => {
      // Admin sozlamalari + ommaviy identity (nom/logo butun ilovada) — ikkalasini
      // ham yangilaymiz, shunda nom o'zgarishi darhol aks etadi (loading/customer/courier).
      qc.invalidateQueries({ queryKey: ['admin', 'restaurant'] });
      qc.invalidateQueries({ queryKey: ['restaurant', 'identity'] });
    },
  });
}

export const DAYS: { key: DayKey; label: string }[] = [
  { key: 'mon', label: 'Dushanba' },
  { key: 'tue', label: 'Seshanba' },
  { key: 'wed', label: 'Chorshanba' },
  { key: 'thu', label: 'Payshanba' },
  { key: 'fri', label: 'Juma' },
  { key: 'sat', label: 'Shanba' },
  { key: 'sun', label: 'Yakshanba' },
];
