'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Check, Loader2, Navigation } from 'lucide-react';
import {
  useAddresses,
  useCreateAddress,
  useChangeOrderAddress,
  useOrderDetail,
} from '@/hooks/use-customer';
import { AddressMapPicker } from '@/components/customer/address-map-picker';

export default function ChangeAddressPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const { data: addresses = [] } = useAddresses();
  const { data: order } = useOrderDetail(orderId);
  const createAddr = useCreateAddress();
  const change = useChangeOrderAddress(orderId);

  const [mapOpen, setMapOpen] = useState(false);
  const [error, setError] = useState('');
  const busy = createAddr.isPending || change.isPending;

  const applyAddress = (addressId: string) => {
    setError('');
    change.mutate(addressId, {
      onSuccess: () => router.push(`/orders/${orderId}`),
      onError: (e) => setError(e instanceof Error ? e.message : "Manzilni o'zgartirib bo'lmadi"),
    });
  };

  const onMapConfirm = (r: { lat: number; lng: number; address: string }) => {
    setMapOpen(false);
    setError('');
    createAddr.mutate(
      { label: 'Buyurtma manzili', addressText: r.address, latitude: r.lat, longitude: r.lng },
      {
        onSuccess: (newAddr) => applyAddress(newAddr.id),
        onError: (e) => setError(e instanceof Error ? e.message : 'Manzil saqlanmadi'),
      },
    );
  };

  return (
    <div className="space-y-4 px-4 pb-28 pt-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-black text-slate-900 dark:text-slate-50">Manzilni o&apos;zgartirish</h1>
      </div>

      {order?.customerAddress?.addressText && (
        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-[11px] font-semibold text-slate-400">Hozirgi manzil</p>
          <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-200">
            {order.customerAddress.addressText}
          </p>
        </div>
      )}

      <p className="text-xs text-slate-500">
        Yangi manzilni tanlang — kuryer yo&apos;lda bo&apos;lsa ham avtomatik yangilanadi.
      </p>

      {/* Xaritadan (GPS) — asosiy */}
      <button
        type="button"
        onClick={() => setMapOpen(true)}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] py-3.5 text-sm font-black text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.55)] active:scale-[0.98] disabled:opacity-60"
      >
        <Navigation size={16} /> Xaritadan tanlash (GPS)
      </button>

      {/* Saqlangan manzillar */}
      {addresses.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Saqlangan manzillar
          </p>
          {addresses.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => applyAddress(a.id)}
              disabled={busy}
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left shadow-sm active:scale-[0.99] disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800">
                <MapPin size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">{a.label}</span>
                <span className="block truncate text-xs text-slate-500">{a.addressText}</span>
              </span>
              <Check size={16} className="shrink-0 text-emerald-500" />
            </button>
          ))}
        </div>
      )}

      {busy && (
        <p className="flex items-center justify-center gap-2 text-center text-xs text-slate-400">
          <Loader2 size={14} className="animate-spin" /> Saqlanmoqda…
        </p>
      )}
      {error && <p className="text-center text-xs text-red-500">{error}</p>}

      {mapOpen && (
        <AddressMapPicker initial={null} onConfirm={onMapConfirm} onClose={() => setMapOpen(false)} />
      )}
    </div>
  );
}
