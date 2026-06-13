'use client';

import { use, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useProducts } from '@/hooks/use-menu';
import { useCartStore } from '@/stores/cart-store';
import { useCustomerPrefs } from '@/stores/customer-prefs-store';
import { useFlyToCart } from '@/components/customer/fly-to-cart';
import { ProductCard } from '@/components/customer/product-card';
import { useT } from '@/lib/i18n/locale-context';

export default function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const t = useT();
  const { data: products = [], isLoading } = useProducts();
  const product = products.find((p) => p.id === productId);
  const similar = products
    .filter((p) => p.id !== productId && p.categoryId === product?.categoryId && p.isActive !== false)
    .slice(0, 4);

  const inCart = useCartStore((s) =>
    s.items.find((i) => i.productId === productId)?.quantity ?? 0,
  );
  const add = useCartStore((s) => s.add);
  const setQty = useCartStore((s) => s.setQty);
  const isFav = useCustomerPrefs((s) => s.favorites.includes(productId));
  const toggleFav = useCustomerPrefs((s) => s.toggleFavorite);
  const fly = useFlyToCart();
  const imgRef = useRef<HTMLDivElement | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3 px-4 pt-4">
        <div className="aspect-square animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-6 w-2/3 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
        <div className="h-4 w-1/2 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="px-4 pt-10 text-center">
        <p className="text-base font-bold text-slate-700 dark:text-slate-300">Mahsulot topilmadi</p>
        <Link href="/" className="mt-3 inline-block text-sm font-bold text-[#c62020]">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const discountPct =
    hasDiscount && product.oldPrice
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : product.discountPercent ?? 0;

  const handleAdd = () => {
    const rect = imgRef.current?.getBoundingClientRect();
    const fromX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const fromY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    fly({
      fromX,
      fromY,
      imageUrl: product.imageUrl,
      onLand: () =>
        add({
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
        }),
    });
  };

  return (
    <div className="space-y-4 px-4 pb-32 pt-3">
      {/* Hero image */}
      <div className="relative">
        <Link
          href="/"
          aria-label={t('common.back')}
          className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-700 shadow-sm backdrop-blur active:scale-95 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200"
        >
          <ArrowLeft size={18} />
        </Link>
        <button
          type="button"
          onClick={() => toggleFav(product.id)}
          aria-label="Favorite"
          className={`absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm backdrop-blur active:scale-95 ${
            isFav
              ? 'bg-white text-[#c62020] dark:bg-slate-900'
              : 'border border-slate-200 bg-white/90 text-slate-600 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300'
          }`}
        >
          <Heart size={18} fill={isFav ? 'currentColor' : 'none'} strokeWidth={2.2} />
        </button>

        <div
          ref={imgRef}
          className="relative aspect-square overflow-hidden rounded-3xl bg-slate-100 shadow-sm dark:bg-slate-800"
        >
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-200/40 via-orange-200/30 to-red-300/40">
              <span className="text-5xl">🍽️</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-3 top-16 flex flex-col gap-1.5">
            {product.isNew && (
              <span className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md">
                {t('product.new')}
              </span>
            )}
            {discountPct > 0 && (
              <span className="rounded-full bg-[#c62020] px-3 py-1 text-[11px] font-black text-white shadow-md">
                −{discountPct}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Title & price */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
          {product.name}
        </h1>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-2xl font-black text-slate-900 tabular-nums dark:text-slate-50">
            {product.price.toLocaleString('uz-UZ')}
            <span className="ml-1 text-sm font-semibold text-slate-400">{t('common.currency')}</span>
          </p>
          {hasDiscount && (
            <p className="text-sm font-bold text-slate-400 line-through tabular-nums">
              {product.oldPrice?.toLocaleString('uz-UZ')}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t('product.description')}
          </p>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {product.description}
          </p>
        </div>
      )}

      {/* Similar */}
      {similar.length > 0 && (
        <div>
          <p className="mb-2 px-1 text-sm font-black text-slate-900 dark:text-slate-100">
            {t('product.similar')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Sticky CTA */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[480px] border-t border-slate-100 bg-white/95 px-4 pb-3 pt-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 86px)' }}
      >
        {inCart > 0 ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center justify-between rounded-2xl border border-slate-200 bg-white px-2 py-2 dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setQty(product.id, inCart - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 active:scale-90 dark:bg-slate-800 dark:text-slate-200"
              >
                <Minus size={16} />
              </button>
              <span className="text-base font-black tabular-nums text-slate-900 dark:text-slate-50">
                {inCart}
              </span>
              <button
                type="button"
                onClick={() => setQty(product.id, inCart + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 active:scale-90 dark:bg-slate-800 dark:text-slate-200"
              >
                <Plus size={16} />
              </button>
            </div>
            <Link
              href="/cart"
              className="flex h-13 items-center gap-2 rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] px-5 py-3.5 text-sm font-black text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.55)] active:scale-95"
            >
              <ShoppingBag size={16} /> {t('nav.cart')}
            </Link>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAdd}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-base font-black text-white shadow-[0_12px_24px_-8px_rgba(198,32,32,0.55)] active:scale-[0.98]"
          >
            <Plus size={18} strokeWidth={2.6} />
            {t('product.add_to_cart')} · {product.price.toLocaleString('uz-UZ')}
          </button>
        )}
      </div>
    </div>
  );
}
