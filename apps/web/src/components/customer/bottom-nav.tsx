'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ClipboardList, User } from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';

const ITEMS = [
  { href: '/', label: 'Bosh', icon: Home },
  { href: '/search', label: 'Qidiruv', icon: Search },
  { href: '/orders', label: 'Buyurtma', icon: ClipboardList },
  { href: '/profile', label: 'Profil', icon: User },
];

export function CustomerBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto grid w-full max-w-[480px] grid-cols-4">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-2.5 transition-colors ${
                active ? 'text-ember' : 'text-slate-400'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 2} />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function CartFab() {
  const count = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  if (count === 0) return null;
  return (
    <Link
      href="/cart"
      className="fixed bottom-20 right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-ember px-5 text-white shadow-lg shadow-ember/30 transition active:scale-95"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <span className="text-sm font-bold">Savat</span>
      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-black text-ember">
        {count}
      </span>
    </Link>
  );
}
