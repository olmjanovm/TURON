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
  const { formatText, language } = useCustomerLanguage();

  const favoriteProducts = React.useMemo(
    () => products.filter((product) => favoriteProductIds.includes(product.id)),
    [favoriteProductIds, products],
  );

  const favoriteCategories = React.useMemo(
    () => sortCustomerCategories(categories).filter((category) => favoriteCategoryIds.includes(category.id)),
    [categories, favoriteCategoryIds],
  );

  const copy = {
    badge:
      language === 'ru' ? 'Избранное' : language === 'uz-cyrl' ? 'Сараланганлар' : 'Saqlanganlar',
    title:
      language === 'ru' ? 'Yoqtirganlar' : language === 'uz-cyrl' ? 'Ёқтирганлар' : 'Yoqtirganlar',
    subtitle:
      language === 'ru'
        ? 'Блюда и разделы, которые вам понравились.'
        : language === 'uz-cyrl'
          ? 'Ёқтирган таомлар ва бўлимлар шу ерда сақланади.'
          : "Yoqtirgan taomlar va bo'limlar shu yerda saqlanadi.",
    products:
      language === 'ru' ? 'Понравившиеся блюда' : language === 'uz-cyrl' ? 'Сақланган таомлар' : 'Saqlangan taomlar',
    productsBadge:
      language === 'ru' ? 'Блюда' : language === 'uz-cyrl' ? 'Таомлар' : 'Taomlar',
    categories:
      language === 'ru' ? "Разделы" : language === 'uz-cyrl' ? "Бўлимлар" : "Bo'limlar",
    categoriesBadge:
      language === 'ru' ? 'Категории' : language === 'uz-cyrl' ? 'Категориялар' : 'Kategoriyalar',
    emptyTitle:
      language === 'ru' ? 'Пока ничего нет' : language === 'uz-cyrl' ? 'Ҳали ҳеч нарса йўқ' : "Hali hech narsa yo'q",
    emptySubtitle:
      language === 'ru'
        ? 'Нажмите на сердечко рядом с блюдом или категорией — оно сохранится здесь.'
        : language === 'uz-cyrl'
          ? 'Taom yoki kategoriya yonidagi yurak tugmasini bosing — u shu yerga saqlanadi.'
          : "Taom yoki kategoriya yonidagi yurak tugmasini bosing — u shu yerga saqlanadi.",
    home:
      language === 'ru' ? 'На главную' : language === 'uz-cyrl' ? 'Бош саҳифа' : 'Asosiy sahifa',
  };

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
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/36">
              {copy.badge}
            </p>
            <h1 className="mt-1.5 text-[1.75rem] font-black tracking-[-0.05em] text-white">
              {copy.title}
            </h1>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-rose-400">
            <Heart size={18} className="fill-current" />
          </div>
        </div>

        <p className="mt-3 text-[13px] leading-6 text-white/48">{copy.subtitle}</p>
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
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/36">
                    {copy.productsBadge}
                  </p>
                  <h2 className="mt-1.5 text-[1.35rem] font-black tracking-[-0.04em] text-white">
                    {copy.products}
                  </h2>
                </div>
                <ProductGrid products={favoriteProducts} />
              </section>
            ) : null}

            {favoriteCategories.length > 0 ? (
              <section>
                <div className="mb-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/36">
                    {copy.categoriesBadge}
                  </p>
                  <h2 className="mt-1.5 text-[1.35rem] font-black tracking-[-0.04em] text-white">
                    {copy.categories}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {favoriteCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => navigate(`/customer/category/${category.id}`)}
                      className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-[12px] font-black text-white transition-transform active:scale-[0.97]"
                    >
                      {formatText(getCustomerCategoryLabel(category.name))}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <EmptyState
            message={copy.emptyTitle}
            subMessage={copy.emptySubtitle}
            action={
              <button
                type="button"
                onClick={() => navigate('/customer')}
                className="rounded-[12px] bg-white px-5 py-3 text-sm font-black text-slate-950"
              >
                {copy.home}
              </button>
            }
          />
        )}
      </section>
    </div>
  );
};

export default FavoritesPage;
