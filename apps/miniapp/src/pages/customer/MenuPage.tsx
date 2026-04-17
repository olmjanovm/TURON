import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  CategoryTabs,
  LoadingSkeleton,
  ProductGrid,
  EmptyState,
} from '../../components/customer/CustomerComponents';
import { useCustomerLanguage } from '../../features/i18n/customerLocale';
import { getCustomerCategoryLabel, sortCustomerCategories } from '../../features/menu/customerCatalog';
import { useCategories, useProducts } from '../../hooks/queries/useMenu';
import { ProductAvailabilityEnum } from '@turon/shared';

const MenuPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();
  const { data: products = [], isLoading: isProductsLoading } = useProducts();
  const { formatText } = useCustomerLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  
  const sortedCategories = useMemo(() => sortCustomerCategories(categories), [categories]);
  
  // Default to first category if none selected, and no search query active
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');

  React.useEffect(() => {
    if (sortedCategories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(sortedCategories[0].id);
    }
  }, [sortedCategories, activeCategoryId]);

  if (isCategoriesLoading || isProductsLoading) {
    return <LoadingSkeleton />;
  }

  const activeProducts = products.filter(
    (product) => product.isActive && product.availability !== ProductAvailabilityEnum.UNAVAILABLE
  );

  const tabs = sortedCategories.map((category) => ({
    id: category.id,
    label: formatText(getCustomerCategoryLabel(category.name)),
  }));

  // Filtering logic
  const filteredProducts = activeProducts.filter((product) => {
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      return formatText(product.name).toLowerCase().includes(query) || 
             (product.description && formatText(product.description).toLowerCase().includes(query));
    }
    return product.categoryId === activeCategoryId;
  });

  return (
    <div
      className="min-h-screen bg-[#f6f6f7] animate-in fade-in duration-300"
      style={{ paddingBottom: 'calc(var(--customer-floating-content-clearance, 164px) + 16px)' }}
    >
      {/* Universal Search & Header */}
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="flex h-[58px] items-center px-4" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="relative h-10 w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-[#9a9aa3]" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-full w-full rounded-xl bg-[#f4f4f5] pl-10 pr-4 text-[14px] font-bold text-[#202020] placeholder-[#9a9aa3] outline-none"
              placeholder="Taom yoki pishiriq qidirish..."
            />
          </div>
        </div>

        {/* Category Tabs (only show when not searching) */}
        {!searchQuery.trim() && (
          <div className="border-t border-slate-100 bg-white">
            <CategoryTabs
              tabs={tabs}
              activeId={activeCategoryId}
              onSelect={(id) => setActiveCategoryId(id)}
            />
          </div>
        )}
      </header>

      {/* Main Content Grid */}
      <main className="px-4 pt-5">
        {!searchQuery.trim() && sortedCategories.find(c => c.id === activeCategoryId) ? (
          <div className="mb-4">
            <h2 className="text-[1.3rem] font-black tracking-tight text-[#202020]">
              {formatText(getCustomerCategoryLabel(sortedCategories.find(c => c.id === activeCategoryId)?.name || { uz: '', ru: '' }))}
            </h2>
            <p className="mt-1 text-[13px] font-semibold text-[#8c8c96]">
              {filteredProducts.length} ta taom topildi
            </p>
          </div>
        ) : searchQuery.trim() ? (
          <div className="mb-4">
            <h2 className="text-[1.3rem] font-black tracking-tight text-[#202020]">
              Qidiruv natijalari
            </h2>
            <p className="mt-1 text-[13px] font-semibold text-[#8c8c96]">
              "{searchQuery}" bo'yicha {filteredProducts.length} ta taom topildi
            </p>
          </div>
        ) : null}

        {filteredProducts.length > 0 ? (
          <ProductGrid products={filteredProducts} />
        ) : (
          <div className="pt-10">
            <EmptyState
              message="Taom topilmadi"
              subMessage={searchQuery.trim() ? "So'rovingizga mos bo'lgan taom yo'q." : "Ushbu bo'limda hozircha hech narsa yo'q."}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default MenuPage;
