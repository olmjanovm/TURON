import Link from 'next/link';
import { Store, Bell } from 'lucide-react';
import { AdminBottomNav } from '@/components/admin/admin-bottom-nav';
import { AdminRoleGuard } from '@/components/admin/admin-role-guard';

/**
 * FAZA I — Admin layout (Next.js + TS). Premium light tema:
 * yumshoq gradient fon, glass header, ekran tagida statik bottom nav.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminRoleGuard>
    <div className="relative min-h-dvh bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 text-slate-900">
      {/* nozik yuqori nur */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-40 opacity-60"
        style={{
          background:
            'radial-gradient(60% 100% at 50% 0%, rgba(198,32,32,0.10), transparent 70%)',
        }}
      />

      <header
        className="sticky top-0 z-40 border-b border-white/40 bg-white/70 backdrop-blur-xl"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mx-auto flex h-16 w-full max-w-[480px] items-center justify-between px-4">
          <div>
            <p className="text-[11px] font-medium text-slate-400">Boshqaruv paneli</p>
            <h1 className="text-lg font-black tracking-tight text-slate-900">TURON</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/restaurant"
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition active:scale-95"
              aria-label="Restoran"
            >
              <Store size={18} />
            </Link>
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition active:scale-95"
              aria-label="Bildirishnomalar"
            >
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-ember ring-2 ring-white" />
            </button>
          </div>
        </div>
      </header>

      <main
        className="relative mx-auto w-full max-w-[480px] px-4 pt-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}
      >
        {children}
      </main>

      <AdminBottomNav />
    </div>
    </AdminRoleGuard>
  );
}
