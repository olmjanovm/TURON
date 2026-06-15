import { CourierBottomNav } from '@/components/courier/courier-bottom-nav';
import { CourierRealtime } from '@/components/courier/courier-realtime';
import { CourierBackButton } from '@/components/courier/courier-back-button';
import { PullToRefresh } from '@/components/pull-to-refresh';

export default function CourierLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 text-slate-900">
      <CourierBackButton />
      <PullToRefresh />
      <CourierRealtime />
      <main
        className="relative mx-auto w-full max-w-[480px]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}
      >
        {children}
      </main>
      <CourierBottomNav />
    </div>
  );
}
