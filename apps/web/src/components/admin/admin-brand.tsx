'use client';

import { useRestaurantSettings } from '@/hooks/use-admin-restaurant';

/** Admin header'dagi restoran nomi — sozlamalardan dinamik (TURON emas, joriy nom). */
export function AdminBrand() {
  const { data } = useRestaurantSettings();
  const name = data?.name?.trim() || 'TURON';
  return <h1 className="text-lg font-black tracking-tight text-slate-900">{name}</h1>;
}
