import React from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, ProductGrid } from '../../components/customer/CustomerComponents';
import { CheckoutSectionCard } from '../../components/customer/CheckoutComponents';
import { useCustomerLanguage } from '../../features/i18n/customerLocale';
import { getCustomerCategoryLabel, sortCustomerCategories } from '../../features/menu/customerCatalog';
import { useCategories, useProducts } from '../../hooks/queries/useMenu';
import { useFavoritesStore } from '../../store/useFavoritesStore';

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: categories = [], isLoading } = useCategories();
  const { data: products = [] } = useProducts();
  const {
    favoriteCategoryIds,
    favoriteProductIds,
    toggleCategoryFavorite,
  } = useFavoritesStore();
  const { formatText } = useCustomerLanguage();

  const favoriteProducts = React.useMemo(
    () => products.filter((product) => favoriteProductIds.includes(product.id)),
    [favoriteProductIds, products],
  );

  const favoriteCategories = React.useMemo(
    () => sortCustomerCategories(categories).filter((category) => favoriteCategoryIds.includes(category.id)),
    [categories, favoriteCategoryIds],
  );

  return (
    <div
      className="min-h-screen animate-in fade-in duration-300"
      style={{ paddingBottom: 'calc(var(--customer-nav-top-edge, 78px) + 16px)' }}
    >
      <section className="px-4 pb-5 pt-[calc(env(safe-area-inset-top,0px)+14px)]">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/customer')}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/36">Saralanganlar</p>
            <h1 className="mt-1.5 text-[1.75rem] font-black tracking-[-0.05em] text-white">Yoqtirganlar</h1>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-rose-400">
            <Heart size={18} className="fill-current" />
          </div>
        </div>

        <p className="mt-4 max-w-[310px] text-[13px] leading-6 text-white/58">
          Hozircha foundation bosqichi: mahsulot va kategoriya saralash shu yerda saqlanadi.
        </p>
      </section>

      <section className="space-y-5 px-4">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-[12px] bg-white/[0.05]" />
            <div className="h-52 animate-pulse rounded-[12px] bg-white/[0.05]" />
          </div>
        ) : favoriteProducts.length > 0 || favoriteCategories.length > 0 ? (
          <>
            {favoriteProducts.length > 0 ? (
              <section>
                <div className="mb-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/36">Mahsulotlar</p>
                  <h2 className="mt-1.5 text-[1.35rem] font-black tracking-[-0.04em] text-white">Saqlangan taomlar</h2>
                </div>
                <ProductGrid products={favoriteProducts} />
              </section>
            ) : null}

            {favoriteCategories.length > 0 ? (
              <CheckoutSectionCard title="Saqlangan bo'limlar">
                <div className="flex flex-wrap gap-2">
                  {favoriteCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategoryFavorite(category.id)}
                      className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-[11px] font-black text-white"
                    >
                      {formatText(getCustomerCategoryLabel(category.name))}
                    </button>
                  ))}
                </div>
              </CheckoutSectionCard>
            ) : null}
          </>
        ) : (
          <EmptyState
            message="Hali hech narsa saqlanmagan"
            subMessage="Yoqtirgan kategoriya va mahsulotlaringiz shu yerda jamlanadi."
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
        )}
      </section>
    </div>
  );
};

export default FavoritesPage;
