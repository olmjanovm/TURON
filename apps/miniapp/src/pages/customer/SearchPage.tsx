import React, { useMemo, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  CategoryCard,
  EmptyState,
  ProductGrid,
} from '../../components/customer/CustomerComponents';
import { useCustomerLanguage } from '../../features/i18n/customerLocale';
import { sortCustomerCategories } from '../../features/menu/customerCatalog';
import { useCategories, useProducts } from '../../hooks/queries/useMenu';

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { formatText } = useCustomerLanguage();

  const normalizedQuery = query.trim().toLowerCase();
  const sortedCategories = useMemo(() => sortCustomerCategories(categories), [categories]);

  const filteredCategories = useMemo(
    () =>
      normalizedQuery
        ? sortedCategories.filter((category) => formatText(category.name).toLowerCase().includes(normalizedQuery))
        : sortedCategories.slice(0, 8),
    [formatText, normalizedQuery, sortedCategories],
  );

  const filteredProducts = useMemo(
    () =>
      normalizedQuery
        ? products.filter((product) => {
            const name = formatText(product.name).toLowerCase();
            const description = formatText(product.description).toLowerCase();
            return name.includes(normalizedQuery) || description.includes(normalizedQuery);
          })
        : products.slice(0, 8),
    [formatText, normalizedQuery, products],
  );

  const isLoading = categoriesLoading || productsLoading;
  const hasResults = filteredCategories.length > 0 || filteredProducts.length > 0;

  return (
    <div
      className="min-h-screen animate-in fade-in duration-300"
      style={{ paddingBottom: 'calc(var(--customer-nav-top-edge, 78px) + 16px)' }}
    >
      <section className="sticky top-0 z-20 bg-[linear-gradient(180deg,rgba(5,7,13,0.98)_0%,rgba(5,7,13,0.9)_100%)] px-4 pb-4 pt-[calc(env(safe-area-inset-top,0px)+14px)] backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/customer')}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/36">Qidiruv</p>
            <h1 className="mt-1.5 text-[1.75rem] font-black tracking-[-0.05em] text-white">Nima qidiramiz?</h1>
          </div>
        </div>

        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/38" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Mahsulot nomini yozing"
            className="h-12 w-full rounded-[12px] border border-white/8 bg-white/[0.06] pl-12 pr-4 text-sm font-bold text-white outline-none placeholder:text-white/28"
          />
        </div>
      </section>

      <section className="px-4 pt-5">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-20 animate-pulse rounded-[12px] bg-white/[0.05]" />
            <div className="h-44 animate-pulse rounded-[12px] bg-white/[0.05]" />
          </div>
        ) : !hasResults ? (
          <EmptyState
            message="Hech narsa topilmadi"
            subMessage="So'rovni boshqacha yozib ko'ring yoki menyu bo'limlaridan tanlang."
          />
        ) : (
          <div className="space-y-5">
            <section>
              <div className="mb-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/36">Bo'limlar</p>
                <h2 className="mt-1.5 text-[1.35rem] font-black tracking-[-0.04em] text-white">Kategoriyalar</h2>
              </div>

              <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
                {filteredCategories.map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            </section>

            <section>
              <div className="mb-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/36">Natijalar</p>
                <h2 className="mt-1.5 text-[1.35rem] font-black tracking-[-0.04em] text-white">Taomlar</h2>
              </div>

              <ProductGrid products={filteredProducts} />
            </section>
          </div>
        )}
      </section>
    </div>
  );
};

export default SearchPage;
