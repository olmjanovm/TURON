'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, Loader2, MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useAddresses, useDeleteAddress, type Address } from '@/hooks/use-customer';
import { useCustomerPrefs } from '@/stores/customer-prefs-store';
import { useT } from '@/lib/i18n/locale-context';

export default function AddressesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[#c62020]" /></div>}>
      <AddressesPageInner />
    </Suspense>
  );
}

function AddressesPageInner() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSelectMode = searchParams.get('select') === '1';

  const { data: addresses = [], isLoading } = useAddresses();
  const selectedId = useCustomerPrefs((s) => s.selectedAddressId);
  const setSelected = useCustomerPrefs((s) => s.setSelectedAddress);
  const del = useDeleteAddress();

  const handleSelect = (a: Address) => {
    setSelected({
      id: a.id,
      label: a.label,
      addressText: a.addressText,
      latitude: a.latitude ?? undefined,
      longitude: a.longitude ?? undefined,
    });
    if (isSelectMode) router.back();
  };

  return (
    <div className="space-y-4 px-4 pb-6 pt-4">
      <div className="flex items-center justify-between">
        <Link
          href={isSelectMode ? '/' : '/profile'}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-black text-slate-900 dark:text-slate-50">{t('address.title')}</h1>
        <Link
          href="/addresses/new"
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.45)] active:scale-95"
          aria-label={t('address.new')}
        >
          <Plus size={18} />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[#c62020]" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <MapPin size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-base font-black text-slate-900 dark:text-slate-100">{t('address.empty.title')}</p>
          <p className="mt-1 text-xs text-slate-500">{t('address.empty.desc')}</p>
          <Link
            href="/addresses/new"
            className="mt-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] px-6 text-sm font-black text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.55)] active:scale-95"
          >
            <Plus size={16} /> {t('address.new')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((a) => {
            const active = a.id === selectedId;
            return (
              <div
                key={a.id}
                className={`relative overflow-hidden rounded-3xl border bg-white p-4 shadow-sm transition dark:bg-slate-900 ${
                  active
                    ? 'border-[#c62020] ring-2 ring-[#c62020]/15'
                    : 'border-slate-100 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                    active ? 'bg-gradient-to-br from-[#c62020] to-[#f97316] text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    <MapPin size={18} />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelect(a)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100">{a.label}</p>
                      {a.isDefault && <Star size={12} className="text-amber-400" fill="currentColor" />}
                      {active && (
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#c62020]/10 px-2 py-0.5 text-[10px] font-black text-[#c62020]">
                          <Check size={10} /> {t('common.confirm')}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{a.addressText}</p>
                    {a.landmark && <p className="mt-0.5 text-[11px] italic text-slate-400">{a.landmark}</p>}
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <Link
                    href={`/addresses/${a.id}/edit`}
                    className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    <Pencil size={12} /> {t('common.edit')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(t('address.delete_confirm'))) del.mutate(a.id);
                    }}
                    className="flex h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-600 active:scale-95 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300"
                  >
                    <Trash2 size={12} /> {t('common.delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
