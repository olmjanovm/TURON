'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { useCartTargetRegister } from './fly-to-cart';
import { useT } from '@/lib/i18n/locale-context';

/**
 * Floating Cart Button — pastki bottom nav'dan 20px tepada, o'ngdan 10px.
 * Faqat savatda mahsulot bo'lsa ko'rinadi. Spring scale animatsiya bilan
 * paydo bo'ladi va yo'qoladi. Fly-to-cart hodisalari uchun target.
 */
export function CartFab() {
  const t = useT();
  const pathname = usePathname() ?? '/';
  const items = useCartStore((s) => s.items);
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const register = useCartTargetRegister();
  const fabRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    register(fabRef.current);
    return () => register(null);
  }, [register, count]);

  // /cart yoki /checkout sahifalarida ko'rsatish kerak emas (sahifa o'zi savat)
  const hideOnPages = pathname.startsWith('/cart') || pathname.startsWith('/checkout');

  return (
    <Link
      ref={fabRef}
      href="/cart"
      aria-label={t('nav.cart')}
      className={`fixed right-[10px] z-50 flex h-14 items-center gap-2.5 rounded-full bg-gradient-to-br from-[#c62020] to-[#f97316] pl-3.5 pr-4 text-white shadow-[0_12px_28px_-8px_rgba(198,32,32,0.65)] transition-all duration-300 active:scale-95 ${
        count > 0 && !hideOnPages
          ? 'translate-y-0 scale-100 opacity-100'
          : 'pointer-events-none translate-y-3 scale-90 opacity-0'
      }`}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px + 20px)',
        willChange: 'transform, opacity',
      }}
    >
      <div className="relative">
        <ShoppingBag size={20} strokeWidth={2.4} />
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-slate-900 px-1 text-[10px] font-black text-white">
          {count > 99 ? '99+' : count}
        </span>
      </div>
      <div className="flex flex-col items-start leading-tight">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
          {t('nav.cart')}
        </span>
        <span className="text-sm font-black tabular-nums">
          {total.toLocaleString('uz-UZ')}
        </span>
      </div>
    </Link>
  );
}
