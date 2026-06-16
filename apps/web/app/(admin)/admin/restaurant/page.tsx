'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Store, Power, MapPin } from 'lucide-react';
import {
  useRestaurantSettings,
  useSaveRestaurant,
  DAYS,
  type RestaurantSettings,
  type WorkingHours,
  type DayKey,
} from '@/hooks/use-admin-restaurant';
import { TextField, Toggle, ImageField, SaveBar } from '@/components/admin/form-fields';
import { MapLocationPicker } from '@/components/admin/map-location-picker';
import { Skeleton, SkeletonRow } from '@/components/ui/skeleton';

function normalizePhone(raw: string): string {
  const d = raw.replace(/[\s-]/g, '');
  return /^\+998\d{9}$/.test(d) ? d : '';
}

export default function AdminRestaurantPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useRestaurantSettings();
  const save = useSaveRestaurant();

  const [form, setForm] = useState<RestaurantSettings | null>(null);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  if (isLoading || !form) {
    if (isError) return <div className="admin-card p-6 text-center text-sm text-slate-500">Sozlamalarni yuklab bo'lmadi.</div>;
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" rounded="rounded-3xl" />
        <SkeletonRow /><SkeletonRow />
      </div>
    );
  }

  const set = <K extends keyof RestaurantSettings>(k: K, v: RestaurantSettings[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const setDay = (day: DayKey, patch: Partial<WorkingHours[DayKey]>) =>
    setForm((f) => (f ? { ...f, workingHours: { ...f.workingHours, [day]: { ...f.workingHours[day], ...patch } } } : f));

  function submit() {
    setError('');
    if (!form) return;
    if (form.name.trim().length < 2) return setError('Restoran nomi kamida 2 harf');
    if (form.addressText.trim().length < 5) return setError('Manzil kamida 5 belgi');

    const patch: Partial<RestaurantSettings> = {
      name: form.name.trim(),
      phone: normalizePhone(form.phone || ''),
      addressText: form.addressText.trim(),
      workingHours: form.workingHours,
      isOpen: form.isOpen,
      autoSchedule: form.autoSchedule,
      logoUrl: form.logoUrl || undefined,
      cardNumber: (form.cardNumber || '').trim(),
    };

    // Koordinatani FAQAT haqiqiy bo'lsa yuboramiz. Avval `Number(...) || 0` 0 yuborardi,
    // backend Zod (lng≥55, lat≥37) uni rad etib BUTUN patch'ni 400 qilardi — natijada
    // nom ham, manzil ham saqlanmasdi. Endi yaroqsiz koordinata patch'ni buzmaydi.
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (Number.isFinite(lat) && lat >= 37 && lat <= 46) patch.latitude = lat;
    if (Number.isFinite(lng) && lng >= 55 && lng <= 75) patch.longitude = lng;

    save.mutate(patch, {
      onSuccess: () => router.push('/admin/dashboard'),
      onError: (e) =>
        setError(e instanceof Error ? e.message : "Saqlashda xatolik. Qayta urinib ko'ring."),
    });
  }

  return (
    <div className="space-y-4 pb-28">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500">
        <ChevronLeft size={18} /> Orqaga
      </button>
      <h1 className="flex items-center gap-2 text-lg font-black text-slate-900">
        <Store size={20} className="text-ember" /> Restoran sozlamalari
      </h1>

      {/* Holat — ochiq/yopiq */}
      <div className={`relative overflow-hidden rounded-3xl p-5 text-white ${form.isOpen ? 'bg-gradient-to-br from-emerald-600 to-emerald-700' : 'bg-gradient-to-br from-slate-700 to-slate-900'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white/60">Hozirgi holat</p>
            <p className="mt-0.5 text-2xl font-black">{form.isOpen ? 'OCHIQ 🟢' : 'YOPIQ 🔴'}</p>
          </div>
          <button
            type="button"
            onClick={() => set('isOpen', !form.isOpen)}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur active:scale-90"
            aria-label="Ochish/yopish"
          >
            <Power size={24} />
          </button>
        </div>
      </div>

      <div className="admin-card p-2">
        <Toggle label="Avtomatik jadval (ish vaqtiga qarab)" value={form.autoSchedule} onChange={(v) => set('autoSchedule', v)} />
      </div>

      {/* Asosiy */}
      <div className="admin-card space-y-3 p-4">
        <TextField label="Restoran nomi" value={form.name} onChange={(v) => set('name', v)} placeholder="TURON Kafe" />
        <TextField label="Telefon (+998...)" value={form.phone} onChange={(v) => set('phone', v)} placeholder="+998901234567" />
        <TextField label="Karta raqami (to'lov uchun)" value={form.cardNumber ?? ''} onChange={(v) => set('cardNumber', v)} placeholder="8600 1234 5678 9012" />
      </div>

      {/* Manzil — xaritadan koordinata bo'yicha */}
      <div className="admin-card space-y-3 p-4">
        <TextField label="Manzil" value={form.addressText} onChange={(v) => set('addressText', v)} placeholder="Ko'cha, uy" />
        <button
          type="button"
          onClick={() => setShowMap(true)}
          className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left active:scale-[0.99]"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <MapPin size={16} className="text-ember" /> Xaritadan belgilash
          </span>
          <span className="admin-num text-[11px] text-slate-400">
            {Number(form.latitude).toFixed(4)}, {Number(form.longitude).toFixed(4)}
          </span>
        </button>
      </div>

      {showMap && (
        <MapLocationPicker
          initial={{ lat: Number(form.latitude) || 41.311, lng: Number(form.longitude) || 69.279 }}
          onCancel={() => setShowMap(false)}
          onConfirm={(lat, lng, addr) => {
            set('latitude', lat);
            set('longitude', lng);
            if (addr) set('addressText', addr);
            setShowMap(false);
          }}
        />
      )}

      {/* Logo */}
      <div className="admin-card p-4">
        <p className="mb-2 text-xs font-semibold text-slate-500">Logo</p>
        <ImageField imageUrl={form.logoUrl || ''} onChange={(url) => set('logoUrl', url)} />
      </div>

      {/* Ish vaqti */}
      <div className="admin-card space-y-2 p-4">
        <p className="text-sm font-bold text-slate-900">Ish vaqti</p>
        {DAYS.map(({ key, label }) => {
          const d = form.workingHours[key];
          return (
            <div key={key} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
              <span className="w-20 text-xs font-semibold text-slate-600">{label}</span>
              {d.closed ? (
                <span className="flex-1 text-xs font-medium text-slate-400">Dam olish</span>
              ) : (
                <div className="flex flex-1 items-center gap-1.5">
                  <input type="time" value={d.open} onChange={(e) => setDay(key, { open: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs" />
                  <span className="text-slate-400">–</span>
                  <input type="time" value={d.close} onChange={(e) => setDay(key, { close: e.target.value })} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs" />
                </div>
              )}
              <button
                type="button"
                onClick={() => setDay(key, { closed: !d.closed })}
                className={`rounded-lg px-2 py-1 text-[10px] font-bold ${d.closed ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}
              >
                {d.closed ? 'Yopiq' : 'Ochiq'}
              </button>
            </div>
          );
        })}
      </div>

      {error && <p className="text-center text-xs text-rose-600">{error}</p>}
      <SaveBar label="Saqlash" onClick={submit} loading={save.isPending} />
    </div>
  );
}
