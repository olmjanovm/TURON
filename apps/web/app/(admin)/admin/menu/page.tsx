'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, ChevronRight, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useAdminCategories, useAdminProducts, useDeleteProduct } from '@/hooks/use-admin-catalog';
import type { MenuProduct } from '@/hooks/use-menu';
import { SkeletonRow } from '@/components/ui/skeleton';

function discountPct(price: number, oldPrice?: number | null) {
  return oldPrice && oldPrice > price && price > 0 ? Math.round((1 - price / oldPrice) * 100) : 0;
}

/** Qatorni bosish → tahrir. O'ngdagi savatcha tugma → o'chirishni tasdiqlash.
 *  (Avval swipe + orqa qizil fon edi; admin-card hover/active transform'larida
 *   qizil chetdan ko'rinib qolardi — endi alohida toza tugma, desktop+mobil.) */
function ProductRow({ p, onDelete }: { p: MenuProduct; onDelete: (p: MenuProduct) => void }) {
  const off = discountPct(p.price, p.oldPrice);

  return (
    <div className="admin-card admin-card-interactive flex items-center gap-2 p-3">
      <Link
        href={`/admin/menu/products/${p.id}/edit`}
        className="flex min-w-0 flex-1 items-center gap-3"
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
      </Link>
      <button
        type="button"
        onClick={() => onDelete(p)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500 active:scale-90"
        aria-label="O'chirish"
      >
        <Trash2 size={16} />
      </button>
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
            <p className="px-1 text-[11px] text-slate-400">Tahrirlash uchun bosing · o'chirish uchun 🗑</p>
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

      {/* O'chirishni tasdiqlash — MARKAZDA (nav tagiga kirmaydi), ixcham, z-[60] */}
      {confirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-5"
          onClick={() => !del.isPending && setConfirm(null)}
        >
          <div
            className="w-full max-w-[300px] rounded-3xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertTriangle size={18} />
            </div>
            <p className="text-center text-sm font-black text-slate-900">«{confirm.name}» o'chirilsinmi?</p>
            <p className="mt-1 text-center text-xs text-slate-500">
              Butunlay o'chiriladi. O'tgan buyurtmalar saqlanadi.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={del.isPending}
                className="flex-1 rounded-2xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 active:scale-95 disabled:opacity-50"
              >
                Yo'q
              </button>
              <button
                type="button"
                onClick={() =>
                  del.mutate(confirm.id, {
                    onSuccess: () => setConfirm(null),
                  })
                }
                disabled={del.isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-red-500 py-2.5 text-sm font-black text-white active:scale-95 disabled:opacity-60"
              >
                {del.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Ha, o'chir
              </button>
            </div>
            {del.isError && <p className="mt-2 text-center text-xs text-red-500">O'chirib bo'lmadi. Qayta urining.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
