'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Loader2, LocateFixed, Map, MapPin, Save } from 'lucide-react';
import {
  useCreateAddress,
  useUpdateAddress,
  type Address,
} from '@/hooks/use-customer';
import { useT } from '@/lib/i18n/locale-context';
import { getCurrentLocation, reverseGeocode } from '@/lib/yandex-maps';
import { useKeyboard, focusScrollIntoView } from '@/hooks/use-keyboard';

// Map picker faqat client'da
const AddressMapPicker = dynamic(
  () => import('./address-map-picker').then((m) => m.AddressMapPicker),
  { ssr: false },
);

export function AddressForm({ initial }: { initial?: Address }) {
  const t = useT();
  const router = useRouter();
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const [label, setLabel] = useState(initial?.label ?? '');
  const [addressText, setAddressText] = useState(initial?.addressText ?? '');
  const [landmark, setLandmark] = useState(initial?.landmark ?? '');
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initial?.latitude != null && initial?.longitude != null
      ? { lat: initial.latitude, lng: initial.longitude }
      : null,
  );
  const [detecting, setDetecting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { isOpen: kbOpen, height: kbHeight } = useKeyboard();

  const handleDetect = async () => {
    setError(null);
    setDetecting(true);
    try {
      const pos = await getCurrentLocation();
      setCoords(pos);
      try {
        const addr = await reverseGeocode(pos);
        if (addr) setAddressText(addr);
      } catch {/* ignore reverse-geocode errors */}
      try {
        const tg = (window as Window & { Telegram?: { WebApp?: { HapticFeedback?: { notificationOccurred?: (s: string) => void } } } })
          .Telegram?.WebApp?.HapticFeedback;
        tg?.notificationOccurred?.('success');
      } catch {/* ignore */}
    } catch (err) {
      setError(err instanceof Error ? err.message : t('address.detect_error'));
    } finally {
      setDetecting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!label.trim() || addressText.trim().length < 5) {
      setError(t('common.required'));
      return;
    }
    const lat = coords?.lat ?? initial?.latitude;
    const lng = coords?.lng ?? initial?.longitude;
    if (lat == null || lng == null) {
      setError(t('address.detect_error') + ' — "Hozirgi joylashuvni aniqlash" tugmasini bosing');
      return;
    }
    const payload = {
      label: label.trim(),
      addressText: addressText.trim(),
      landmark: landmark.trim() || null,
      latitude: lat,
      longitude: lng,
    };
    const done = () => router.replace('/addresses');
    const onErr = (e: unknown) => setError(e instanceof Error ? e.message : t('common.error'));
    if (initial) {
      update.mutate({ id: initial.id, patch: payload }, { onSuccess: done, onError: onErr });
    } else {
      create.mutate(payload, { onSuccess: done, onError: onErr });
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-32 pt-4">
      <div className="flex items-center justify-between">
        <Link
          href="/addresses"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-black text-slate-900 dark:text-slate-50">
          {initial ? t('address.edit') : t('address.new')}
        </h1>
        <div className="w-10" />
      </div>

      {/* Manzil tanlash — 2 ta tugma yonma-yon */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleDetect}
          disabled={detecting}
          className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[#c62020]/30 bg-[#c62020]/5 px-3 py-3.5 text-xs font-black text-[#c62020] transition active:scale-[0.98] disabled:opacity-60 dark:border-[#c62020]/40 dark:bg-[#c62020]/10"
        >
          {detecting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              {t('address.detecting')}
            </>
          ) : (
            <>
              <LocateFixed size={14} />
              GPS
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] px-3 py-3.5 text-xs font-black text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.45)] transition active:scale-[0.98]"
        >
          <Map size={14} />
          Xaritadan
        </button>
      </div>

      {coords && (
        <div className="-mt-2 flex items-center justify-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
          <span>✓</span>
          <span className="tabular-nums">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
        </div>
      )}

      {pickerOpen && (
        <AddressMapPicker
          initial={coords ?? null}
          onClose={() => setPickerOpen(false)}
          onConfirm={({ lat, lng, address }) => {
            setCoords({ lat, lng });
            setAddressText(address);
            setError(null);
            setPickerOpen(false);
          }}
        />
      )}

      <Field label={t('address.label')}>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onFocus={focusScrollIntoView}
          placeholder={t('address.label.placeholder')}
          className="input"
        />
      </Field>

      <Field label={t('address.text')}>
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-3.5 text-slate-400" />
          <textarea
            rows={2}
            value={addressText}
            onChange={(e) => setAddressText(e.target.value)}
            onFocus={focusScrollIntoView}
            placeholder={t('address.text.placeholder')}
            className="input pl-10 pt-3 leading-snug"
          />
        </div>
      </Field>

      <Field label={t('address.landmark')}>
        <input
          type="text"
          value={landmark}
          onChange={(e) => setLandmark(e.target.value)}
          onFocus={focusScrollIntoView}
          placeholder={t('address.landmark.placeholder')}
          className="input"
        />
      </Field>

      {error && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:bg-red-500/15 dark:text-red-300">
          {error}
        </div>
      )}

      <div
        className="fixed inset-x-0 z-50 mx-auto w-full max-w-[480px] border-t border-slate-100 bg-white/95 px-4 pb-3 pt-3 backdrop-blur-xl transition-[bottom] duration-200 dark:border-slate-800 dark:bg-slate-950/95"
        style={{
          bottom: kbOpen ? kbHeight : 0,
          paddingBottom: kbOpen ? 12 : 'calc(env(safe-area-inset-bottom, 0px) + 86px)',
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-base font-black text-white shadow-[0_12px_24px_-8px_rgba(198,32,32,0.55)] active:scale-[0.98] disabled:opacity-50"
        >
          {pending ? <Loader2 size={20} className="animate-spin" /> : <><Save size={16} /> {t('common.save')}</>}
        </button>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          padding: 12px 16px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          transition: border-color 0.15s;
        }
        :global(.input:focus) { border-color: #c62020; }
        :global(.dark .input) { background: #1e293b; border-color: #334155; color: #f1f5f9; }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}
