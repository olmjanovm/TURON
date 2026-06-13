'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, ChevronRight } from 'lucide-react';
import { useAdminCategories, useAdminProducts } from '@/hooks/use-admin-catalog';
import { SkeletonRow } from '@/components/ui/skeleton';

function discountPct(price: number, oldPrice?: number | null) {
  return oldPrice && oldPrice > price && price > 0 ? Math.round((1 - price / oldPrice) * 100) : 0;
}

export default function AdminMenuPage() {
  const [tab, setTab] = useState<'products' | 'categories'>('products');
  const { data: categories, isLoading: catLoading } = useAdminCategories();
  const { data: products, isLoading: prodLoading } = useAdminProducts();

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
            {(products ?? []).map((p) => {
              const off = discountPct(p.price, p.oldPrice);
              return (
                <Link
                  key={p.id}
                  href={`/admin/menu/products/${p.id}/edit`}
                  className="admin-card admin-card-interactive flex items-center gap-3 p-3"
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
                        <span className="shrink-0 rounded-full bg-ember px-1.5 py-0.5 text-[9px] font-black text-white">
                          −{off}%
                        </span>
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
              );
            })}
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
    </div>
  );
}
