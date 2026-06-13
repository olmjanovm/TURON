'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { useSaveCategory, useDeleteCategory, type CategoryPayload } from '@/hooks/use-admin-catalog';
import type { MenuCategory } from '@/hooks/use-menu';
import { TextField, Toggle, ImageField, SaveBar } from './form-fields';

export function CategoryForm({ initial }: { initial?: MenuCategory }) {
  const router = useRouter();
  const save = useSaveCategory(initial?.id);
  const del = useDeleteCategory();

  const [name, setName] = useState(initial?.name ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState('');

  function submit() {
    setError('');
    if (!name.trim()) return setError('Nom majburiy');
    const payload: CategoryPayload = {
      name: name.trim(),
      imageUrl: imageUrl || undefined,
      sortOrder: Number(sortOrder) || 0,
      isActive,
    };
    save.mutate(payload, { onSuccess: () => router.push('/admin/menu') });
  }

  return (
    <div className="space-y-4 pb-28">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500">
        <ChevronLeft size={18} /> Menyu
      </button>
      <h1 className="text-lg font-black text-slate-900">{initial ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}</h1>

      <div className="admin-card p-4"><ImageField imageUrl={imageUrl} onChange={setImageUrl} /></div>

      <div className="admin-card space-y-3 p-4">
        <TextField label="Nomi" value={name} onChange={setName} placeholder="Kategoriya nomi" />
        <TextField label="Tartib raqami" value={sortOrder} onChange={setSortOrder} placeholder="0" numeric />
      </div>

      <div className="admin-card p-2"><Toggle label="Faol (ko'rinadi)" value={isActive} onChange={setIsActive} /></div>

      {initial && (
        <button
          type="button"
          disabled={del.isPending}
          onClick={() => { if (confirm('Kategoriya o\'chirilsinmi?')) del.mutate(initial.id, { onSuccess: () => router.push('/admin/menu') }); }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white py-3 text-sm font-bold text-rose-600 active:scale-[0.99]"
        >
          <Trash2 size={16} /> O'chirish
        </button>
      )}

      {error && <p className="text-center text-xs text-rose-600">{error}</p>}
      <SaveBar label={initial ? 'Saqlash' : 'Qo\'shish'} onClick={submit} loading={save.isPending} />
    </div>
  );
}
