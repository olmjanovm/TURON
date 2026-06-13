'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, ChevronDown, MapPin, Search, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { useCustomerPrefs } from '@/stores/customer-prefs-store';
import { useT } from '@/lib/i18n/locale-context';
import { useCartTargetRegister } from './fly-to-cart';

/**
 * Premium customer header.
 * Chap: yetkazib berish manzili (▾ tanlash uchun /addresses sahifaga).
 * O'ng: qidiruv 🔍, bildirishnoma 🔔 (badge), savat 🛍 (badge + flight target).
 */
export function CustomerHeader() {
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const selected = useCustomerPrefs((s) => s.selectedAddress);
  const t = useT();

  const cartRef = useRef<HTMLAnchorElement | null>(null);
  const register = useCartTargetRegister();

  useEffect(() => {
    register(cartRef.current);
    return () => register(null);
  }, [register]);

  return (
    <header
      className="sticky top-0 z-40 border-b border-slate-100/80 bg-white/80 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="mx-auto flex h-16 w-full max-w-[480px] items-center gap-2 px-4">
        {/* Address dropdown */}
        <Link
          href="/addresses?select=1"
          className="group flex min-w-0 flex-1 items-center gap-2 rounded-2xl px-2 py-1.5 transition active:scale-[0.98]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.45)]">
            <MapPin size={16} strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t('home.delivery_to')}
            </p>
            <div className="flex items-center gap-1">
              <p className="truncate text-sm font-black text-slate-900 dark:text-slate-100">
                {selected?.addressText || t('home.choose_address')}
              </p>
              <ChevronDown size={14} className="shrink-0 text-slate-400" />
            </div>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href="/search"
            aria-label={t('common.search')}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <Search size={17} />
          </Link>
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <Bell size={17} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#c62020] ring-2 ring-white dark:ring-slate-900" />
          </Link>
          <Link
            ref={cartRef}
            href="/cart"
            aria-label={t('nav.cart')}
            className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.45)] active:scale-95"
          >
            <ShoppingBag size={17} strokeWidth={2.4} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-slate-900 px-1 text-[10px] font-black text-white dark:border-slate-950">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
