'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Plus, ChevronRight, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useAdminCategories, useAdminProducts, useDeleteProduct } from '@/hooks/use-admin-catalog';
import type { MenuProduct } from '@/hooks/use-menu';
import { SkeletonRow } from '@/components/ui/skeleton';

function discountPct(price: number, oldPrice?: number | null) {
  return oldPrice && oldPrice > price && price > 0 ? Math.round((1 - price / oldPrice) * 100) : 0;
}

/** Chapga surib → "O'chirish" ochiladi (tap → tasdiqlash). Tap (surilmagan) → tahrir. */
function ProductRow({ p, onDelete }: { p: MenuProduct; onDelete: (p: MenuProduct) => void }) {
  const startX = useRef<number | null>(null);
  const [tx, setTx] = useState(0);
  const off = discountPct(p.price, p.oldPrice);
  const open = tx <= -40;

  const onTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const dx = Math.min(0, e.touches[0].clientX - startX.current);
    setTx(Math.max(dx, -84));
  };
  const onTouchEnd = () => { setTx(tx < -42 ? -84 : 0); startX.current = null; };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={() => onDelete(p)}
        className="absolute right-0 top-0 flex h-full items-center justify-center rounded-r-2xl bg-red-500 px-4 text-white active:bg-red-600"
        style={{ width: 84 }}
        aria-label="O'chirish"
      >
        <Trash2 size={18} />
      </button>
      <Link
        href={`/admin/menu/products/${p.id}/edit`}
        onClick={(e) => { if (open) { e.preventDefault(); setTx(0); } }}
        className="admin-card admin-card-interactive relative flex items-center gap-3 p-3 transition-transform"
        style={{ transform: `translateX(${tx}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-bold text-slate-900">{p.name}</p>
            {off > 0 && (
              <span className="shrink-0 rounded-full bg-ember px-1.5 py-0.5 text-[9px] font-black text-white">−{off}%</span>
            )}
          </div>
          <p className="admin-num text-xs text-slate-500">
            {p.price.toLocaleString('uz-UZ')} so'm
            {off > 0 && p.oldPrice ? (
              <span className="ml-1.5 text-slate-300 line-through">{p.oldPrice.toLocaleString('uz-UZ')}</span>
            ) : null}
          </p>
        </div>
        <span className={`admin-pill ${p.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
          {p.isActive !== false ? 'Faol' : 'Nofaol'}
        </span>
        <ChevronRight size={16} className="shrink-0 text-slate-300" />
      </Link>
    </div>
  );
}

export default function AdminMenuPage() {
  const [tab, setTab] = useState<'products' | 'categories'>('products');
  const { data: categories, isLoading: catLoading } = useAdminCategories();
  const { data: products, isLoading: prodLoading } = useAdminProducts();
  const del = useDeleteProduct();
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);

  return (
    <div className="space-y-4">
      {/* Tablar */}
      <div className="flex gap-2">
        {(['products', 'categories'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-2xl py-2.5 text-sm font-bold transition ${
              tab === t
                ? 'bg-gradient-to-r from-ember to-orange-500 text-white shadow-sm shadow-ember/30'
                : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {t === 'products' ? `Mahsulotlar ${products ? `(${products.length})` : ''}` : `Kategoriyalar ${categories ? `(${categories.length})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'products' ? (
        prodLoading ? (
          <div className="space-y-2"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/admin/menu/products/new"
              className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-ember/30 bg-ember/5 py-3 text-sm font-bold text-ember active:scale-[0.99]"
            >
              <Plus size={16} /> Yangi mahsulot qo'shish
            </Link>
            <p className="px-1 text-[11px] text-slate-400">Mahsulotni chapga suring → o'chirish</p>
            {(products ?? []).map((p) => (
              <ProductRow key={p.id} p={p} onDelete={(prod) => setConfirm({ id: prod.id, name: prod.name })} />
            ))}
            {(products ?? []).length === 0 && <p className="admin-card p-8 text-center text-sm text-slate-400">Mahsulot yo'q</p>}
          </div>
        )
      ) : catLoading ? (
        <div className="space-y-2"><SkeletonRow /><SkeletonRow /></div>
      ) : (
        <div className="space-y-2">
          <Link
            href="/admin/menu/categories/new"
            className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-ember/30 bg-ember/5 py-3 text-sm font-bold text-ember active:scale-[0.99]"
          >
            <Plus size={16} /> Yangi kategoriya qo'shish
          </Link>
          {(categories ?? []).map((c) => (
            <Link key={c.id} href={`/admin/menu/categories/${c.id}/edit`} className="admin-card admin-card-interactive flex items-center gap-3 p-3">
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
                ) : null}
              </div>
              <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">{c.name}</p>
              <span className={`admin-pill ${c.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                {c.isActive !== false ? 'Faol' : 'Nofaol'}
              </span>
              <ChevronRight size={16} className="shrink-0 text-slate-300" />
            </Link>
          ))}
          {(categories ?? []).length === 0 && <p className="admin-card p-8 text-center text-sm text-slate-400">Kategoriya yo'q</p>}
        </div>
      )}

      {/* O'chirishni tasdiqlash */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => !del.isPending && setConfirm(null)}>
          <div className="w-full max-w-[360px] rounded-3xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertTriangle size={22} />
            </div>
            <p className="text-center text-base font-black text-slate-900">Mahsulot o'chirilsinmi?</p>
            <p className="mt-1 text-center text-sm text-slate-500">
              «{confirm.name}» butunlay o'chiriladi (qaytarib bo'lmaydi). O'tgan buyurtmalar saqlanadi.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={del.isPending}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 active:scale-95 disabled:opacity-50"
              >
                Bekor
              </button>
              <button
                type="button"
                onClick={() =>
                  del.mutate(confirm.id, {
                    onSuccess: () => setConfirm(null),
                  })
                }
                disabled={del.isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-red-500 py-3 text-sm font-black text-white active:scale-95 disabled:opacity-60"
              >
                {del.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} O'chirish
              </button>
            </div>
            {del.isError && <p className="mt-2 text-center text-xs text-red-500">O'chirib bo'lmadi. Qayta urining.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
