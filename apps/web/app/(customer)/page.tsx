'use client';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useCategories, useProducts, type MenuProduct } from '@/hooks/use-menu';
import { useCartStore } from '@/stores/cart-store';
import { haptic } from '@/lib/telegram';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
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
