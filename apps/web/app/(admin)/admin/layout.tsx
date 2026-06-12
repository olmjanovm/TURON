import Link from 'next/link';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Truck, Tag } from 'lucide-react';

/**
 * FAZA I — Admin layout (Next.js + TS, light/oq tema).
 * Eski React miniapp admin'i o'rniga. Operatsion, toza, oq fon.
 */

const NAV = [
  { href: '/admin/dashboard', label: 'Bosh', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Buyurtma', icon: ShoppingBag },
  { href: '/admin/menu', label: 'Menyu', icon: UtensilsCrossed },
  { href: '/admin/couriers', label: 'Kuryer', icon: Truck },
  { href: '/admin/promos', label: 'Promo', icon: Tag },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header
        className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mx-auto flex h-14 w-full max-w-[480px] items-center justify-between px-4">
          <span className="text-base font-bold tracking-tight">TURON Admin</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Onlayn
          </span>
        </div>
      </header>

      <main
        className="mx-auto w-full max-w-[480px] px-4 pt-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}
      >
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto grid w-full max-w-[480px] grid-cols-5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-2.5 text-slate-500 transition-colors hover:text-sky-600"
            >
              <Icon size={20} strokeWidth={2} />
              <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
