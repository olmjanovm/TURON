'use client';

import { useEffect, useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UserRoleEnum } from '@turon/shared';
import { useCategories, useProducts, type MenuProduct } from '@/hooks/use-menu';
import { useCartStore } from '@/stores/cart-store';
import { useAuth } from '@/hooks/use-auth';
import { haptic, isTelegramEnvironment } from '@/lib/telegram';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const { user, status } = useAuth();
  const router = useRouter();
  // null = not yet checked (SSR), true/false = client value
  const [isTg, setIsTg] = useState<boolean | null>(null);

  useEffect(() => {
    setIsTg(isTelegramEnvironment());
  }, []);

  // Redirect non-customer roles to their home
  useEffect(() => {
    if (status !== 'authenticated' || !user) return;
    if (user.role === UserRoleEnum.ADMIN) {
      router.replace('/admin/dashboard');
    } else if (user.role === UserRoleEnum.COURIER) {
      router.replace('/courier');
    }
  }, [status, user, router]);

  // Show splash: initial SSR, Telegram env during auth, or while redirecting non-customer
  const showSplash =
    isTg === null || // SSR / before mount
    (isTg && (status === 'idle' || status === 'authenticating')) || // loading in Telegram
    (status === 'authenticated' && user?.role !== UserRoleEnum.CUSTOMER); // redirect in progress

  if (showSplash) return <Splash />;

  if (status === 'error') {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6 text-center">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Kirishda xatolik</p>
          <p className="mt-1 text-xs text-slate-400">
            Ilovani Telegram orqali oching va qayta urining
          </p>
        </div>
      </div>
    );
  }

  return <CustomerHome />;
}

function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-50 to-slate-100">
      <div
        className="h-14 w-14 rounded-3xl shadow-lg flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #c62020, #e53935)' }}
      >
        <span className="text-2xl font-black text-white">T</span>
      </div>
      <div className="h-1 w-24 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full w-full animate-[shimmer_1.2s_ease-in-out_infinite] bg-gradient-to-r from-slate-200 via-slate-400 to-slate-200" />
      </div>
    </div>
  );
}

function CustomerHome() {
  return <CustomerHomeContent />;
}

function CustomerHomeContent() {
  const { data: categories, isLoading: catLoading } = useCategories();
  const { data: products, isLoading: prodLoading } = useProducts();
  const [activeCat, setActiveCat] = useState<string>('ALL');

  const visible = useMemo(() => {
    const list = (products ?? []).filter((p) => p.isActive !== false);
    return activeCat === 'ALL' ? list : list.filter((p) => p.categoryId === activeCat);
  }, [products, activeCat]);

  return (
    <div>
      {/* Ember hero */}
      <header
        className="tier-decor relative overflow-hidden bg-tandir px-5 pb-6 text-white"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}
      >
        <div
          className="tier-decor pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--color-ember), transparent 70%)' }}
        />
        <p className="relative text-sm text-white/60">Assalomu alaykum 👋</p>
        <h1 className="relative mt-1 text-2xl font-black tracking-tight">
          Bugun nima <span className="text-ember">tandirdan</span> olamiz?
        </h1>
      </header>

      {/* Kategoriya chiplari */}
      <div className="-mt-3 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {catLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-24 shrink-0" rounded="rounded-full" />
              ))
            : [{ id: 'ALL', name: 'Hammasi' }, ...(categories ?? [])].map((c) => {
                const active = activeCat === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCat(c.id)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? 'border-ember bg-ember text-white'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
        </div>
      </div>

      {/* Mahsulotlar gridi */}
      <div className="grid grid-cols-2 gap-3 px-4 pt-2">
        {prodLoading
          ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : visible.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      {!prodLoading && visible.length === 0 && (
        <p className="px-4 py-12 text-center text-sm text-slate-400">
          Bu bo'limda mahsulot yo'q
        </p>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: MenuProduct }) {
  const add = useCartStore((s) => s.add);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="relative aspect-square bg-slate-100">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : null}
        {product.isNew && (
          <span className="absolute left-2 top-2 rounded-full bg-spark px-2 py-0.5 text-[10px] font-black text-tandir">
            YANGI
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{product.name}</h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-black text-slate-900">
            {product.price.toLocaleString('uz-UZ')}
          </span>
          <button
            type="button"
            onClick={() => {
              add({ productId: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl });
              haptic.impact('light');
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-ember text-white transition active:scale-90"
            aria-label="Savatga qo'shish"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <Skeleton className="aspect-square w-full" rounded="rounded-none" />
      <div className="p-3">
        <Skeleton className="h-3.5 w-3/4" rounded="rounded-md" />
        <div className="mt-3 flex items-center justify-between">
          <Skeleton className="h-4 w-12" rounded="rounded-md" />
          <Skeleton className="h-8 w-8" rounded="rounded-full" />
        </div>
      </div>
    </div>
  );
}
