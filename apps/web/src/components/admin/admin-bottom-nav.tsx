'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Truck, Tag } from 'lucide-react';

const NAV = [
  { href: '/admin/dashboard', label: 'Bosh', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Buyurtma', icon: ShoppingBag },
  { href: '/admin/menu', label: 'Menyu', icon: UtensilsCrossed },
  { href: '/admin/couriers', label: 'Kuryer', icon: Truck },
  { href: '/admin/promos', label: 'Promo', icon: Tag },
];

export function AdminBottomNav() {
  const pathname = usePathname();

  // Form/sozlama sahifalarida (yaratish/tahrirlash/restoran) nav yashiriladi —
  // pastki save bar o'rnini egallaydi, ustma-ust tushmaydi.
  const isFormRoute = /\/(new|edit|restaurant)$/.test(pathname);
  if (isFormRoute) return null;

  return (
    <nav
      className="admin-nav fixed inset-x-0 bottom-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex h-[68px] w-full max-w-[480px] items-end justify-around px-2 pb-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              data-active={active}
              className="admin-nav-item group relative flex flex-1 flex-col items-center justify-end gap-1"
            >
              <span
                className={`admin-nav-chip flex h-11 w-11 items-center justify-center rounded-2xl ${
                  active ? '' : 'text-slate-400 group-active:scale-90'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className="admin-nav-label text-[10px] font-semibold text-slate-400">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
