'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, ClipboardList, User } from 'lucide-react';
import { useT } from '@/lib/i18n/locale-context';
import { useCustomerPrefs } from '@/stores/customer-prefs-store';

export function CustomerBottomNav() {
  const pathname = usePathname() ?? '/';
  const t = useT();
  const favCount = useCustomerPrefs((s) => s.favorites.length);

  const ITEMS = [
    { href: '/',           label: t('nav.home'),      icon: Home,          match: (p: string) => p === '/' || p.startsWith('/product/') || p.startsWith('/menu/') },
    { href: '/favorites',  label: t('nav.favorites'), icon: Heart,         match: (p: string) => p.startsWith('/favorites'),  badge: favCount },
    { href: '/orders',     label: t('nav.orders'),    icon: ClipboardList, match: (p: string) => p.startsWith('/orders') },
    { href: '/profile',    label: t('nav.profile'),   icon: User,          match: (p: string) => p.startsWith('/profile') },
  ];

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-slate-100 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-4 px-2">
        {ITEMS.map(({ href, label, icon: Icon, match, badge }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className="group relative flex flex-col items-center gap-0.5 py-2.5"
            >
              <span
                className={`relative flex h-9 w-9 items-center justify-center rounded-2xl transition-all ${
                  active
                    ? 'bg-gradient-to-br from-[#c62020] to-[#f97316] text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.45)]'
                    : 'text-slate-400 group-active:scale-90 dark:text-slate-500'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                {badge && badge > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-[#c62020] px-1 text-[9px] font-black text-white dark:border-slate-950">
                    {badge > 9 ? '9+' : badge}
                  </span>
                ) : null}
              </span>
              <span className={`text-[10px] font-bold ${active ? 'text-[#c62020]' : 'text-slate-400 dark:text-slate-500'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Kept for backward compat — endi CustomerHeader'da cart bor
export function CartFab() {
  return null;
}
