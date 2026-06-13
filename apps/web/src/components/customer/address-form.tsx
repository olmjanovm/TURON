'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, MapPin, Save } from 'lucide-react';
import {
  useCreateAddress,
  useUpdateAddress,
  type Address,
} from '@/hooks/use-customer';
import { useT } from '@/lib/i18n/locale-context';

export function AddressForm({ initial }: { initial?: Address }) {
  const t = useT();
  const router = useRouter();
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const [label, setLabel] = useState(initial?.label ?? '');
  const [addressText, setAddressText] = useState(initial?.addressText ?? '');
  const [landmark, setLandmark] = useState(initial?.landmark ?? '');
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!label.trim() || !addressText.trim()) {
      setError(t('common.required'));
      return;
    }
    const payload = {
      label: label.trim(),
      addressText: addressText.trim(),
      landmark: landmark.trim() || null,
      isDefault,
      latitude: initial?.latitude ?? null,
      longitude: initial?.longitude ?? null,
    };
    const done = () => router.replace('/addresses');
    if (initial) {
      update.mutate({ id: initial.id, patch: payload }, { onSuccess: done, onError: (e) => setError(e instanceof Error ? e.message : t('common.error')) });
    } else {
      create.mutate(payload, { onSuccess: done, onError: (e) => setError(e instanceof Error ? e.message : t('common.error')) });
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

      <Field label={t('address.label')}>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
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
          placeholder={t('address.landmark.placeholder')}
          className="input"
        />
      </Field>

      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="h-5 w-5 accent-[#c62020]"
        />
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
          {t('address.default')}
        </span>
      </label>

      {error && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:bg-red-500/15 dark:text-red-300">
          {error}
        </div>
      )}

      <div
        className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] border-t border-slate-100 bg-white/95 px-4 pb-3 pt-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 86px)' }}
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
