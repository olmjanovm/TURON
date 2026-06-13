'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Home, ListOrdered } from 'lucide-react';
import { useT } from '@/lib/i18n/locale-context';

export default function OrderSuccessPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const t = useT();

  useEffect(() => {
    try {
      const tg = (window as Window & { Telegram?: { WebApp?: { HapticFeedback?: { notificationOccurred?: (s: string) => void } } } })
        .Telegram?.WebApp?.HapticFeedback;
      tg?.notificationOccurred?.('success');
    } catch {/* ignore */}
  }, []);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-2xl shadow-emerald-500/40">
          <CheckCircle2 size={48} strokeWidth={2.5} />
        </div>
      </div>

      <h1 className="mt-8 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
        {t('success.title')}
      </h1>
      <p className="mt-2 max-w-xs text-sm text-slate-500">{t('success.desc')}</p>

      <div className="mt-8 grid w-full max-w-xs grid-cols-2 gap-3">
        <Link
          href={`/orders/${orderId}`}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-sm font-black text-white shadow-[0_12px_24px_-8px_rgba(198,32,32,0.55)] active:scale-[0.98]"
        >
          <ListOrdered size={16} /> {t('success.cta.orders')}
        </Link>
        <Link
          href="/"
          className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <Home size={16} /> {t('success.cta.home')}
        </Link>
      </div>
    </div>
  );
}
