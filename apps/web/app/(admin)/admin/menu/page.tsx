'use client';

import { useState } from 'react';
import { useAdminCategories, useAdminProducts } from '@/hooks/use-admin-catalog';
import { SkeletonRow } from '@/components/ui/skeleton';

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
            {(products ?? []).map((p) => (
              <div key={p.id} className="admin-card flex items-center gap-3 p-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{p.name}</p>
                  <p className="admin-num text-xs text-slate-500">{p.price.toLocaleString('uz-UZ')} so'm</p>
                </div>
                <span className={`admin-pill ${p.isActive !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                  {p.isActive !== false ? 'Faol' : 'Nofaol'}
                </span>
              </div>
            ))}
            {(products ?? []).length === 0 && <p className="admin-card p-8 text-center text-sm text-slate-400">Mahsulot yo'q</p>}
          </div>
        )
      ) : catLoading ? (
        <div className="space-y-2"><SkeletonRow /><SkeletonRow /></div>
      ) : (
        <div className="space-y-2">
          {(categories ?? []).map((c) => (
            <div key={c.id} className="admin-card flex items-center gap-3 p-3">
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
            </div>
          ))}
          {(categories ?? []).length === 0 && <p className="admin-card p-8 text-center text-sm text-slate-400">Kategoriya yo'q</p>}
        </div>
      )}
    </div>
  );
}
