import React from 'react';
import { ArrowLeft, Heart, Search } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CategoryTabs,
  EmptyState,
  LoadingSkeleton,
  ProductGrid,
} from '../../components/customer/CustomerComponents';
import { useCustomerLanguage } from '../../features/i18n/customerLocale';
import { getCategoryImageUrl, getCategoryPosterUrl } from '../../features/menu/placeholders';
import { getCustomerCategoryLabel, sortCustomerCategories } from '../../features/menu/customerCatalog';
import { useCategories, useProducts } from '../../hooks/queries/useMenu';
import { useFavoritesStore } from '../../store/useFavoritesStore';

const CategoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();
  const { data: products = [], isLoading: isProductsLoading } = useProducts();
  const { favoriteCategoryIds, toggleCategoryFavorite } = useFavoritesStore();
  const { formatText } = useCustomerLanguage();
  const sortedCategories = React.useMemo(() => sortCustomerCategories(categories), [categories]);
  const selectedCategory = sortedCategories.find((category) => category.id === id) || sortedCategories[0];
  const [heroImageSrc, setHeroImageSrc] = React.useState('');

  React.useEffect(() => {
    if (!selectedCategory) {
      return;
    }
    setHeroImageSrc(getCategoryImageUrl(selectedCategory));
  }, [selectedCategory]);

  // 🚨 CRITICAL FIX: Faqatgina kesh umuman bo'sh bo'lsa (birinchi marta) Skeleton ko'rsatamiz.
  // Keyingi safar keshdagi ma'lumot 0ms da chiqadi (Re-render CPU sarfi 80% ga tushadi).
  const isLoading = isCategoriesLoading || isProductsLoading;
  const hasData = categories.length > 0 && products.length > 0;

  if (isLoading && !hasData) {
    return (
      <div className="min-h-screen bg-[#f6f6f7] px-4 pb-6 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!selectedCategory) {
    return (
      <div
        className="px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)]"
        style={{ paddingBottom: 'calc(var(--customer-nav-top-edge, 78px) + 16px)' }}
      >
        <EmptyState
          message="Bo'lim topilmadi"
          subMessage="Asosiy sahifaga qaytib boshqa taom bo'limini tanlang."
          action={
            <button
              type="button"
              onClick={() => navigate('/customer')}
              className="rounded-[12px] bg-white px-5 py-3 text-sm font-black text-slate-950"
            >
              Asosiy sahifa
            </button>
          }
        />
      </div>
    );
  }

  const currentProducts = products.filter((product) => product.categoryId === selectedCategory.id);
  const isFavoriteCategory = favoriteCategoryIds.includes(selectedCategory.id);
  const heroPosterSrc = getCategoryPosterUrl(selectedCategory);
  const tabs = sortedCategories.map((category) => ({
    id: category.id,
    label: formatText(getCustomerCategoryLabel(category.name)),
  }));

  return (
    <div
      className="min-h-screen animate-in slide-in-from-right duration-500"
      style={{ paddingBottom: 'calc(var(--customer-floating-content-clearance, 164px) + 16px)' }}
    >
      <section className="relative overflow-hidden px-4 pb-5 pt-[calc(env(safe-area-inset-top,0px)+14px)]">
        <div className="absolute inset-x-0 top-0 h-56 overflow-hidden">
          <img
            src={heroImageSrc}
            alt={formatText(getCustomerCategoryLabel(selectedCategory.name))}
            className="h-full w-full object-cover opacity-56"
            onError={() => {
              if (heroImageSrc !== heroPosterSrc) {
                setHeroImageSrc(heroPosterSrc);
              }
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.16)_0%,rgba(2,6,23,0.82)_72%,#05070d_100%)]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/customer')}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-950/62 text-white backdrop-blur-xl"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/customer/search')}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-950/62 text-white backdrop-blur-xl"
              >
                <Search size={18} />
              </button>
              <button
                type="button"
                onClick={() => toggleCategoryFavorite(selectedCategory.id)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-950/62 text-white backdrop-blur-xl"
              >
                <Heart size={18} className={isFavoriteCategory ? 'fill-current text-rose-400' : ''} />
              </button>
            </div>
          </div>

          <div className="pt-16">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/46">Turon Kafesi menyusi</p>
            <h1 className="mt-2 text-[2rem] font-black leading-[0.96] tracking-[-0.05em] text-white">
              {formatText(getCustomerCategoryLabel(selectedCategory.name))}
            </h1>
            <p className="mt-3 max-w-[300px] text-[13px] leading-6 text-white/66">
              Taom kartalari ixcham, narx aniq, qoshish tugmasi esa doim tez ishlash uchun korinib turadi.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <div className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/76">
                20-35 daqiqa
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/76">
                {currentProducts.length} ta taom
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-20 bg-[linear-gradient(180deg,rgba(5,7,13,0.98)_0%,rgba(5,7,13,0.88)_100%)] pb-3 pt-2 backdrop-blur-xl">
        <CategoryTabs
          tabs={tabs}
          activeId={selectedCategory.id}
          onSelect={(nextId) => navigate(`/customer/category/${nextId}`)}
        />
      </section>

      <section className="px-4 pt-5">
        {currentProducts.length > 0 ? (
          <ProductGrid products={currentProducts} />
        ) : (
          <EmptyState
            message="Hozircha taom yo'q"
            subMessage="Bu bo'limga keyinroq yangi mahsulotlar qo'shiladi."
          />
        )}
      </section>
    </div>
  );
};

export default CategoryPage;
