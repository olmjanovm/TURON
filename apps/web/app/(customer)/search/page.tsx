'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { useProducts } from '@/hooks/use-menu';
import { useCustomerPrefs } from '@/stores/customer-prefs-store';
import { ProductCard } from '@/components/customer/product-card';
import { useT } from '@/lib/i18n/locale-context';
import { focusScrollIntoView } from '@/hooks/use-keyboard';

export default function SearchPage() {
  const t = useT();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const { data: products = [] } = useProducts();
  const recent = useCustomerPrefs((s) => s.recentSearches);
  const pushRecent = useCustomerPrefs((s) => s.pushRecentSearch);
  const clearRecent = useCustomerPrefs((s) => s.clearRecentSearches);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim().toLowerCase()), 250);
    return () => clearTimeout(id);
  }, [query]);

  const results = useMemo(() => {
    if (!debounced) return [];
    return products.filter(
      (p) =>
        p.isActive !== false &&
        (p.name.toLowerCase().includes(debounced) || p.description?.toLowerCase().includes(debounced)),
    );
  }, [products, debounced]);

  useEffect(() => {
    if (debounced.length >= 3 && results.length > 0) pushRecent(debounced);
  }, [debounced, results.length, pushRecent]);

  return (
    <div className="space-y-4 px-4 pb-6 pt-4">
      <div className="relative">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={focusScrollIntoView}
          placeholder={t('search.placeholder')}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm font-medium text-slate-900 outline-none focus:border-[#c62020] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="clear"
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {!debounced && recent.length > 0 && (
        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('search.recent')}</p>
            <button type="button" onClick={clearRecent} className="text-[11px] font-bold text-slate-400">
              {t('common.delete')}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuery(q)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {debounced && results.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <SearchIcon size={28} className="mx-auto mb-3 text-slate-300" />
          <p className="text-base font-black text-slate-900 dark:text-slate-100">{t('search.empty.title')}</p>
          <p className="mt-1 text-xs text-slate-500">{t('search.empty.desc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {results.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
