'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Plus } from 'lucide-react';
import type { MenuProduct } from '@/hooks/use-menu';
import { useCartStore } from '@/stores/cart-store';
import { useCustomerPrefs } from '@/stores/customer-prefs-store';
import { useFlyToCart } from './fly-to-cart';
import { useT } from '@/lib/i18n/locale-context';

export function ProductCard({ product }: { product: MenuProduct }) {
  const t = useT();
  const add = useCartStore((s) => s.add);
  const inCart = useCartStore((s) =>
    s.items.find((i) => i.productId === product.id)?.quantity ?? 0,
  );
  const isFav = useCustomerPrefs((s) => s.favorites.includes(product.id));
  const toggleFav = useCustomerPrefs((s) => s.toggleFavorite);
  const fly = useFlyToCart();
  const imgRef = useRef<HTMLDivElement | null>(null);
  const lastFlyRef = useRef(0);

  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const discountPct =
    hasDiscount && product.oldPrice
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : product.discountPercent ?? 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1) Savatga DARHOL qo'shamiz — son tezda oshadi (40 marta bossang ham bir zumda 40).
    //    Avval add() animatsiya tugagach (onLand, ~540ms) chaqirilardi → 40 bosish
    //    40 ta ketma-ket flight ortida kutib qolardi (juda sekin). Endi darhol.
    add({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });

    // 2) Animatsiyani THROTTLE qilamiz: tez-tez bosishda har bosishga flight
    //    yaratmaymiz (faqat ~350ms da bir marta). Son baribir har bosishda oshadi.
    const now = Date.now();
    if (now - lastFlyRef.current < 350) return;
    lastFlyRef.current = now;

    const rect = imgRef.current?.getBoundingClientRect();
    const fromX = rect ? rect.left + rect.width / 2 : (e as React.MouseEvent).clientX;
    const fromY = rect ? rect.top + rect.height / 2 : (e as React.MouseEvent).clientY;
    fly({ fromX, fromY, imageUrl: product.imageUrl });
  };

  return (
    <Link
      href={`/product/${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
    >
      <div ref={imgRef} className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 480px) 50vw, 240px"
            loading="lazy"
            className="object-cover transition-transform group-active:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-200/40 via-orange-200/30 to-red-300/40">
            <span className="text-3xl">🍽️</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.isNew && (
            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
              {t('product.new')}
            </span>
          )}
          {discountPct > 0 && (
            <span className="rounded-full bg-[#c62020] px-2 py-0.5 text-[10px] font-black text-white shadow-md">
              −{discountPct}%
            </span>
          )}
        </div>

        {/* Favorite */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFav(product.id);
          }}
          aria-label="Favorite"
          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition active:scale-90 ${
            isFav ? 'bg-white text-[#c62020]' : 'bg-black/30 text-white'
          }`}
        >
          <Heart size={14} strokeWidth={2.4} fill={isFav ? 'currentColor' : 'none'} />
        </button>

        {/* In cart badge */}
        {inCart > 0 && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-black text-white backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-white" /> {inCart}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          {product.name}
        </h3>
        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="min-w-0">
            <p className="text-base font-black text-slate-900 tabular-nums dark:text-slate-50">
              {product.price.toLocaleString('uz-UZ')}
            </p>
            {hasDiscount && (
              <p className="-mt-0.5 text-[10px] font-bold text-slate-400 line-through tabular-nums">
                {product.oldPrice?.toLocaleString('uz-UZ')}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            aria-label={t('product.add_to_cart')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-white shadow-[0_6px_14px_-4px_rgba(198,32,32,0.5)] transition active:scale-90"
          >
            <Plus size={18} strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="aspect-square animate-pulse bg-slate-100 dark:bg-slate-800" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="flex items-center justify-between">
          <div className="h-4 w-12 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-9 w-9 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
