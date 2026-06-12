import { CustomerBottomNav, CartFab } from '@/components/customer/bottom-nav';

/** FAZA B — Customer layout (TURON Olovi: tandir header, light body). */
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <main
        className="mx-auto w-full max-w-[480px]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
      >
        {children}
      </main>
      <CartFab />
      <CustomerBottomNav />
    </div>
  );
}
