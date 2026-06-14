'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { UserRoleEnum } from '@turon/shared';
import { useCategories, useProducts } from '@/hooks/use-menu';
import { useAuth } from '@/hooks/use-auth';
import { isTelegramEnvironment } from '@/lib/telegram';
import { ProductCard, ProductCardSkeleton } from '@/components/customer/product-card';
import { RestaurantBrand } from '@/components/restaurant-brand';
import { useT } from '@/lib/i18n/locale-context';
import { useRestaurantDocumentTitle } from '@/hooks/use-restaurant-identity';
import { apiFetch } from '@/lib/api-client';
import type { MenuProduct } from '@/hooks/use-menu';

export default function CustomerHomePage() {
  const { user, status } = useAuth();
  const router = useRouter();
  const [isTg, setIsTg] = useState<boolean | null>(null);

  useEffect(() => {
    setIsTg(isTelegramEnvironment());
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || !user) return;
    if (user.role === UserRoleEnum.ADMIN) router.replace('/admin/dashboard');
    else if (user.role === UserRoleEnum.COURIER) router.replace('/courier');
  }, [status, user, router]);

  const showSplash =
    isTg === null ||
    (isTg && (status === 'idle' || status === 'authenticating')) ||
    (status === 'authenticated' && user?.role !== UserRoleEnum.CUSTOMER);

  if (showSplash) return <Splash />;
  if (status === 'error') return <AuthError />;
  return <CustomerHome />;
}

function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <RestaurantBrand size={64} rounded="lg" />
      <div className="h-1 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-gradient-to-r from-[#c62020] to-[#f97316]" />
      </div>
    </div>
  );
}

function AuthError() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6 text-center">
      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Kirishda xatolik</p>
        <p className="mt-1 text-xs text-slate-400">Ilovani Telegram orqali oching va qayta urining</p>
      </div>
    </div>
  );
}

function CustomerHome() {
  const t = useT();
  useRestaurantDocumentTitle();
  // RSC tomondan dehydrated bo'lib kelgan — bu hook'lar cache'dan darrov o'qiydi,
  // network ko'rinmas (background revalidate staleTime'dan keyin)
  const { data: categories, isLoading: catLoading } = useCategories();
  const { data: products, isLoading: prodLoading } = useProducts();
  const [activeCat, setActiveCat] = useState<string>('ALL');

  // Idle vaqtda buyurtmalarni va profilni prefetch — navigatsiya darrov ko'rinadi
  useIdlePrefetchCustomer();

  const visible = useMemo(() => {
    const list = (products ?? []).filter((p) => p.isActive !== false);
    return activeCat === 'ALL' ? list : list.filter((p) => p.categoryId === activeCat);
  }, [products, activeCat]);

  const newOnes = useMemo(
    () => (products ?? []).filter((p) => p.isNew && p.isActive !== false).slice(0, 6),
    [products],
  );
  const popular = useMemo(
    () => (products ?? []).filter((p) => p.isPopular && p.isActive !== false).slice(0, 6),
    [products],
  );

  return (
    <div className="space-y-5 px-4 pb-6 pt-4">
      {/* Categories chips */}
      <div className="-mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {catLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-24 shrink-0 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
                />
              ))
            : [{ id: 'ALL', name: t('home.categories.all') }, ...(categories ?? [])].map((c) => {
                const active = activeCat === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCat(c.id)}
                    className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all ${
                      active
                        ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                        : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
        </div>
      </div>

      {/* New / Popular rails — only when ALL */}
      {activeCat === 'ALL' && (
        <>
          {newOnes.length > 0 && (
            <ProductRail title={t('home.section.new')} products={newOnes} />
          )}
          {popular.length > 0 && (
            <ProductRail title={t('home.section.popular')} products={popular} />
          )}
        </>
      )}

      {/* Main grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="h-3 w-1 rounded-full bg-[#c62020]" />
            <p className="text-sm font-black text-slate-900 dark:text-slate-100">
              {activeCat === 'ALL'
                ? t('home.categories.all')
                : categories?.find((c) => c.id === activeCat)?.name ?? ''}
            </p>
          </div>
          {!prodLoading && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {visible.length}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {prodLoading
            ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : visible.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {!prodLoading && visible.length === 0 && (
          <p className="px-4 py-12 text-center text-sm text-slate-400">
            {t('home.empty.no_products')}
          </p>
        )}
      </section>
    </div>
  );
}

function ProductRail({ title, products }: { title: string; products: MenuProduct[] }) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="h-3 w-1 rounded-full bg-[#c62020]" />
        <p className="text-sm font-black text-slate-900 dark:text-slate-100">{title}</p>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((p) => (
          <div key={p.id} className="w-40 shrink-0">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Idle vaqtda customer orders va profile'ni cache'ga oldindan yuklash —
 * shu sahifadan navigatsiya qilganda 0ms ko'rinish.
 *
 *  • requestIdleCallback bo'lsa ishlatamiz, aks holda setTimeout 1500ms
 *  • Auth bo'lmaganda yoki rol kuryer/admin bo'lsa skip
 */
function useIdlePrefetchCustomer(): void {
  const qc = useQueryClient();
  const { user, status } = useAuth();

  useEffect(() => {
    if (status !== 'authenticated' || user?.role !== UserRoleEnum.CUSTOMER) return;

    const run = () => {
      void qc.prefetchQuery({
        queryKey: ['customer', 'orders'],
        queryFn: () => apiFetch('/orders/my'),
        staleTime: 10_000,
      });
    };

    type IdleWin = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const w = window as IdleWin;
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(run, { timeout: 2_500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(run, 1_500);
    return () => window.clearTimeout(t);
  }, [qc, status, user?.role]);
}
