import React, { useMemo, useState } from 'react';
import { ArrowLeft, Plus, Search, Sparkles, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProductAvailabilityEnum } from '@turon/shared';
import { useCustomerLanguage } from '../../features/i18n/customerLocale';
import {
  getCartItemImageUrl,
  getCategoryImageUrl,
  getCategoryPosterUrl,
  getProductImageUrl,
  getProductPosterUrl,
} from '../../features/menu/placeholders';
import {
  getCustomerCategoryLabel,
  getProductPromotion,
  getProductSecondaryText,
  sortCustomerCategories,
} from '../../features/menu/customerCatalog';
import type { MenuCategory, MenuProduct } from '../../features/menu/types';
import { useCategories, useProducts } from '../../hooks/queries/useMenu';
import { useCartStore } from '../../store/useCartStore';

const normalize = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[\u00B4`']/g, '')
    .replace(/\s+/g, ' ');

const productIsAvailable = (product: MenuProduct) =>
  product.isActive && product.availability === ProductAvailabilityEnum.AVAILABLE;

const SearchCategoryCard: React.FC<{ category: MenuCategory }> = ({ category }) => {
  const navigate = useNavigate();
  const { formatText } = useCustomerLanguage();
  const posterSrc = React.useMemo(() => getCategoryPosterUrl(category), [category]);
  const [imageSrc, setImageSrc] = React.useState(() => getCategoryImageUrl(category));

  React.useEffect(() => {
    setImageSrc(getCategoryImageUrl(category));
  }, [category]);

  return (
    <button
      type="button"
      onClick={() => navigate(`/customer/category/${category.id}`)}
      className="group flex h-[108px] w-[108px] shrink-0 flex-col overflow-hidden rounded-[18px] bg-white text-left shadow-[0_10px_24px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.04] transition active:scale-[0.97]"
    >
      <div className="h-[72px] w-full overflow-hidden bg-slate-100">
        <img
          src={imageSrc}
          alt={formatText(category.name)}
          className="h-full w-full object-cover transition duration-500 group-active:scale-105"
          onError={() => {
            if (imageSrc !== posterSrc) {
              setImageSrc(posterSrc);
            }
          }}
        />
      </div>
      <div className="flex min-h-0 flex-1 items-center px-3">
        <p className="line-clamp-1 text-[12.5px] font-black tracking-[-0.03em] text-[#202020]">
          {formatText(getCustomerCategoryLabel(category.name))}
        </p>
      </div>
    </button>
  );
};

const SearchProductCard: React.FC<{ product: MenuProduct }> = ({ product }) => {
  const navigate = useNavigate();
  const { formatText } = useCustomerLanguage();
  const addToCart = useCartStore((state) => state.addToCart);
  const posterSrc = React.useMemo(() => getProductPosterUrl(product), [product]);
  const [imageSrc, setImageSrc] = React.useState(() =>
    getProductImageUrl(
      {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        categoryId: product.categoryId,
      },
      product.categoryId,
    ),
  );
  const promotion = React.useMemo(() => getProductPromotion(product), [product]);
  const available = productIsAvailable(product);

  React.useEffect(() => {
    setImageSrc(
      getProductImageUrl(
        {
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          categoryId: product.categoryId,
        },
        product.categoryId,
      ),
    );
  }, [product]);

  const handleAdd = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!available) return;

    addToCart({
      id: product.id,
      menuItemId: product.id,
      categoryId: product.categoryId,
      name: product.name,
      description: product.description,
      price: product.price,
      image: getCartItemImageUrl({
        id: product.id,
        name: product.name,
        image: imageSrc,
      }),
      isAvailable: true,
    });
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/customer/product/${product.id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(`/customer/product/${product.id}`);
        }
      }}
      className={`group relative min-h-[260px] overflow-hidden rounded-[18px] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.04] transition active:scale-[0.985] ${
        available ? '' : 'opacity-60 grayscale'
      }`}
    >
      <div className="relative h-[142px] overflow-hidden bg-slate-100">
        <img
          src={imageSrc}
          alt={formatText(product.name)}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-active:scale-[1.03]"
          onError={() => {
            if (imageSrc !== posterSrc) {
              setImageSrc(posterSrc);
            }
          }}
        />
        {promotion.badgeLabel ? (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-lg ${
              promotion.kind === 'discount' ? 'bg-emerald-500' : 'bg-sky-500'
            }`}
          >
            {promotion.badgeLabel}
          </span>
        ) : null}
      </div>

      <div className="flex min-h-[118px] flex-col px-3.5 pb-3.5 pt-3">
        <h3 className="line-clamp-1 text-[16px] font-black leading-tight tracking-[-0.03em] text-[#202020]">
          {formatText(product.name)}
        </h3>
        <p className="mt-1.5 line-clamp-2 min-h-[34px] text-[12.5px] font-semibold leading-[17px] text-[#8c8c96]">
          {formatText(getProductSecondaryText(product) || product.description || 'Mazali taom')}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            <p className="truncate text-[17px] font-black tracking-[-0.04em] text-[#202020]">
              {product.price.toLocaleString()} so'm
            </p>
            {promotion.oldPrice ? (
              <p className="mt-0.5 text-[11px] font-semibold text-slate-300 line-through">
                {promotion.oldPrice.toLocaleString()} so'm
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!available}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-[0_12px_20px_rgba(15,23,42,0.22)] transition active:scale-90 ${
              available ? 'bg-[#202124] text-white' : 'bg-slate-200 text-slate-400'
            }`}
            aria-label="Savatga qo'shish"
          >
            <Plus size={22} strokeWidth={2.7} />
          </button>
        </div>
      </div>
    </article>
  );
};

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { formatText } = useCustomerLanguage();

  const normalizedQuery = normalize(query);
  const sortedCategories = useMemo(() => sortCustomerCategories(categories), [categories]);

  const filteredCategories = useMemo(
    () =>
      normalizedQuery
        ? sortedCategories.filter((category) =>
            normalize(formatText(getCustomerCategoryLabel(category.name))).includes(normalizedQuery),
          )
        : sortedCategories.slice(0, 8),
    [formatText, normalizedQuery, sortedCategories],
  );

  const activeProducts = useMemo(
    () => products.filter((product) => product.isActive),
    [products],
  );
  const filteredProducts = useMemo(
    () =>
      (normalizedQuery
        ? activeProducts.filter((product) => {
            const haystack = normalize(
              `${formatText(product.name)} ${formatText(product.description)} ${product.weight ?? ''} ${
                product.weightText ?? ''
              }`,
            );
            return haystack.includes(normalizedQuery);
          })
        : activeProducts.slice(0, 10)
      ).sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)),
    [activeProducts, formatText, normalizedQuery],
  );

  const isLoading = categoriesLoading || productsLoading;
  const hasResults = filteredCategories.length > 0 || filteredProducts.length > 0;

  return (
    <div className="min-h-screen bg-[#f6f6f7] text-[#202020]">
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/95 px-4 backdrop-blur-xl">
        <div className="mx-auto flex h-[58px] max-w-[430px] items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/customer')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4f4f5] text-[#202124] transition active:scale-90 active:bg-slate-200"
            aria-label="Orqaga"
          >
            <ArrowLeft size={19} strokeWidth={2.5} />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a0a0a8]">Qidiruv</p>
            <h1 className="mt-0.5 truncate text-[20px] font-black tracking-[-0.04em] text-[#202020]">
              Nima qidiramiz?
            </h1>
          </div>
          <div className="h-10 w-10 shrink-0" />
        </div>
      </header>

      <main className="mx-auto max-w-[430px] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+118px)] pt-4">
        <label className="flex h-[52px] w-full items-center gap-3 rounded-[18px] bg-white px-4 text-[#9a9aa3] shadow-[0_10px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.04]">
          <Search size={20} strokeWidth={2.3} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Mahsulot nomini yozing"
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-[#202020] outline-none placeholder:text-[#9a9aa3]"
            autoComplete="off"
            autoFocus={false}
          />
        </label>

        {isLoading ? (
          <div className="mt-5 space-y-4">
            <div className="h-28 animate-pulse rounded-[22px] bg-white shadow-sm" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-64 animate-pulse rounded-[18px] bg-white shadow-sm" />
              <div className="h-64 animate-pulse rounded-[18px] bg-white shadow-sm" />
            </div>
          </div>
        ) : !hasResults ? (
          <section className="mt-8 rounded-[24px] bg-white px-6 py-12 text-center shadow-[0_10px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.035]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f4f4f5] text-[#202124]">
              <Search size={28} strokeWidth={2.4} />
            </div>
            <h2 className="mt-5 text-[21px] font-black tracking-[-0.05em]">Hech narsa topilmadi</h2>
            <p className="mt-2 text-[14px] font-semibold leading-6 text-[#8c8c96]">
              So'rovni boshqacha yozib ko'ring yoki menyu bo'limlaridan tanlang.
            </p>
          </section>
        ) : (
          <div className="space-y-7">
            <section className="mt-5">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a0a0a8]">Bo'limlar</p>
                  <h2 className="mt-1 text-[22px] font-black tracking-[-0.05em] text-[#202020]">Kategoriyalar</h2>
                </div>
                <Utensils size={21} className="mb-1 text-[#c3a26d]" />
              </div>

              <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
                {filteredCategories.map((category) => (
                  <SearchCategoryCard key={category.id} category={category} />
                ))}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#a0a0a8]">
                    {normalizedQuery ? 'Natijalar' : 'Tavsiya'}
                  </p>
                  <h2 className="mt-1 text-[22px] font-black tracking-[-0.05em] text-[#202020]">
                    {normalizedQuery ? 'Taomlar' : "Ko'p tanlanadi"}
                  </h2>
                </div>
                <Sparkles size={21} className="mb-1 text-amber-500" />
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-4 max-[340px]:gap-x-3">
                {filteredProducts.map((product) => (
                  <SearchProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchPage;
