'use client';

import { Heart } from 'lucide-react';
import { useProducts } from '@/hooks/use-menu';
import { useCustomerPrefs } from '@/stores/customer-prefs-store';
import { ProductCard } from '@/components/customer/product-card';
import { useT } from '@/lib/i18n/locale-context';

export default function FavoritesPage() {
  const t = useT();
  const favIds = useCustomerPrefs((s) => s.favorites);
  const { data: products = [] } = useProducts();
  const items = products.filter((p) => favIds.includes(p.id));

  return (
    <div className="space-y-4 px-4 pb-6 pt-4">
      <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-50">
        {t('favorites.title')}
      </h1>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Heart size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-base font-black text-slate-900 dark:text-slate-100">
            {t('favorites.empty.title')}
          </p>
          <p className="mt-1 text-xs text-slate-500">{t('favorites.empty.desc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
