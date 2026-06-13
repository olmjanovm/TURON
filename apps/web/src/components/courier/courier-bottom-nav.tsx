'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, List, History, CircleUserRound } from 'lucide-react';
import { useKeyboard } from '@/hooks/use-keyboard';

const TABS = [
  { href: '/courier',               label: 'Asosiy',     icon: Home,             match: (p: string) => p === '/courier' },
  { href: '/courier/orders',        label: 'Buyurtmalar', icon: List,            match: (p: string) => p.startsWith('/courier/orders') || p.startsWith('/courier/order/') },
  { href: '/courier/history',       label: 'Tarix',      icon: History,          match: (p: string) => p.startsWith('/courier/history') },
  { href: '/courier/profile',       label: 'Profil',     icon: CircleUserRound,  match: (p: string) => p.startsWith('/courier/profile') },
];

export function CourierBottomNav() {
  const pathname = usePathname() ?? '/courier';
  const { isOpen: kbOpen } = useKeyboard();

  return (
    <nav
      className={`fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] border-t border-slate-100 bg-white/80 backdrop-blur-xl transition-transform duration-200 ${
        kbOpen ? 'pointer-events-none -translate-x-1/2 translate-y-full' : '-translate-x-1/2 translate-y-0'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-4 px-2">
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              data-active={active}
              className="courier-nav-item group flex flex-col items-center gap-0.5 py-2.5"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-all ${
                  active
                    ? 'bg-gradient-to-br from-[#c62020] to-[#f97316] text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.45)]'
                    : 'text-slate-400 group-active:scale-90'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className={`text-[10px] font-bold ${active ? 'text-[#c62020]' : 'text-slate-400'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
