import { LocaleProvider } from '@/lib/i18n/locale-context';
import { CustomerHeader } from '@/components/customer/customer-header';
import { CustomerBottomNav } from '@/components/customer/bottom-nav';
import { CartFab } from '@/components/customer/cart-fab';
import { FlyToCartProvider } from '@/components/customer/fly-to-cart';
import { CustomerBackButton } from '@/components/customer/customer-back-button';
import { PullToRefresh } from '@/components/pull-to-refresh';

/**
 * Customer layout — premium, theme-aware (rang tokenlari globals.css'da),
 * i18n (3 til: uz, uz-Cyrl, ru), fly-to-cart.
 * Sticky header, statik bottom nav, floating CartFab (savat to'lganda).
 */
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <FlyToCartProvider>
        <div className="relative min-h-dvh bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-50">
          <PullToRefresh />
          <CustomerBackButton />
          <CustomerHeader />
          <main
            className="relative mx-auto w-full max-w-[480px]"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 86px)' }}
          >
            {children}
          </main>
          <CartFab />
          <CustomerBottomNav />
        </div>
      </FlyToCartProvider>
    </LocaleProvider>
  );
}
