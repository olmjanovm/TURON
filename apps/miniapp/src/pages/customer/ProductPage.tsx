import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Heart, ShoppingBag } from 'lucide-react';
import { ProductAvailabilityEnum } from '@turon/shared';
import { EmptyState, QuantitySelector } from '../../components/customer/CustomerComponents';
import { useProductById } from '../../hooks/queries/useMenu';
import { useCartStore } from '../../store/useCartStore';
import { getProductImageUrl, getProductPosterUrl } from '../../features/menu/placeholders';
import { getProductPromotion, getProductSecondaryText } from '../../features/menu/customerCatalog';
import { useCustomerLanguage } from '../../features/i18n/customerLocale';
import { useFavoritesStore } from '../../store/useFavoritesStore';

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, isError } = useProductById(id || '');
  const { addToCart, items } = useCartStore();
  const { formatText } = useCustomerLanguage();
  const { favoriteProductIds, toggleProductFavorite } = useFavoritesStore();

  const existingItem = items.find((item) => item.id === id);
  const [quantity, setQuantity] = useState(existingItem?.quantity || 1);
  const posterSrc = useMemo(() => (product ? getProductPosterUrl(product) : ''), [product]);
  const [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    if (!product) {
      setImageSrc('');
      return;
    }

    setImageSrc(
      getProductImageUrl({
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        categoryId: product.categoryId,
      }),
    );
  }, [product]);

  if (isLoading) {
    return (
      <div className="space-y-4 px-4 py-4 animate-pulse">
        <div className="h-[280px] rounded-[12px] bg-white/[0.05]" />
        <div className="h-24 rounded-[12px] bg-white/[0.05]" />
        <div className="h-36 rounded-[12px] bg-white/[0.05]" />
      </div>
    );
  }

  if (isError || !product) {
    return <EmptyState message="Taom topilmadi" subMessage="Mahsulotni qayta ochib ko'ring." />;
  }

  const isAvailable = product.isActive && product.availability === ProductAvailabilityEnum.AVAILABLE;
  const isTemporarilyUnavailable = product.availability === ProductAvailabilityEnum.TEMPORARILY_UNAVAILABLE;
  const promotion = getProductPromotion(product);
  const isFavorite = favoriteProductIds.includes(product.id);

  const handleAddToCart = () => {
    if (!isAvailable) {
      return;
    }

    addToCart(
      {
        id: product.id,
        menuItemId: product.id,
        categoryId: product.categoryId,
        name: product.name,
        description: product.description,
        price: product.price,
        image: imageSrc || product.imageUrl,
        isAvailable: true,
      },
      quantity,
    );

    navigate('/customer/cart');
  };

  return (
    <div
      className="space-y-5 animate-in slide-in-from-bottom duration-500"
      style={{ paddingBottom: 'calc(var(--customer-sticky-panel-clearance, 190px) + 16px)' }}
    >
      <section className="relative overflow-hidden rounded-[12px] shadow-[0_16px_32px_rgba(2,6,23,0.26)]">
        <img
          src={imageSrc}
          alt={formatText(product.name)}
          className="h-[280px] w-full object-cover"
          onError={() => {
            if (imageSrc !== posterSrc) {
              setImageSrc(posterSrc);
            }
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.08)_0%,rgba(2,6,23,0.82)_100%)]" />

        <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-950/62 text-white backdrop-blur-xl"
          >
            <ArrowLeft size={18} />
          </button>

          <button
            type="button"
            onClick={() => toggleProductFavorite(product.id)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-950/62 text-white backdrop-blur-xl"
          >
            <Heart size={18} className={isFavorite ? 'fill-current text-rose-400' : ''} />
          </button>
        </div>

        <div className="absolute left-3 top-16 flex flex-wrap gap-2">
          {promotion.kind === 'discount' && promotion.discountPercent ? (
            <span className="rounded-full bg-emerald-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-950">
              -{promotion.discountPercent}%
            </span>
          ) : promotion.badgeLabel ? (
            <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
              {promotion.badgeLabel}
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/58">Turon Kafesi</p>
          <h1 className="mt-2 text-[1.9rem] font-black leading-[0.98] tracking-[-0.05em] text-white">
            {formatText(product.name)}
          </h1>
          <div className="mt-3 flex items-end gap-3">
            <p className="text-[1.6rem] font-black text-white">{product.price.toLocaleString()} so'm</p>
            {promotion.oldPrice ? (
              <p className="pb-1 text-sm font-semibold text-white/36 line-through">
                {promotion.oldPrice.toLocaleString()} so'm
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-[12px] border border-white/8 bg-[#111827] p-4 shadow-[0_12px_24px_rgba(2,6,23,0.2)]">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/36">Qisqacha</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-white/74">
          {formatText(product.description) || getProductSecondaryText(product)}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {product.weight ? (
            <span className="rounded-full border border-white/8 bg-white/[0.05] px-3 py-2 text-[11px] font-semibold text-white/72">
              {formatText(product.weight)}
            </span>
          ) : null}
          <span
            className={`rounded-full border px-3 py-2 text-[11px] font-semibold ${
              isAvailable
                ? 'border-emerald-300/18 bg-emerald-400/10 text-emerald-200'
                : 'border-rose-300/18 bg-rose-400/10 text-rose-200'
            }`}
          >
            {isAvailable ? 'Mavjud' : isTemporarilyUnavailable ? 'Vaqtincha yoq' : 'Tugagan'}
          </span>
        </div>
      </section>

      <section className="rounded-[12px] border border-white/8 bg-[#111827] p-4 shadow-[0_12px_24px_rgba(2,6,23,0.2)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/36">Miqdor</p>
            <p className="mt-1.5 text-sm font-semibold text-white/64">Taomni savatga qoshishdan oldin sonini belgilang</p>
          </div>
          <QuantitySelector
            quantity={quantity}
            onIncrease={() => setQuantity((current) => current + 1)}
            onDecrease={() => setQuantity((current) => Math.max(1, current - 1))}
          />
        </div>
      </section>

      <div
        className="fixed inset-x-0 z-40 px-4"
        style={{ bottom: 'var(--customer-floating-cart-offset, calc(env(safe-area-inset-bottom, 0px) + 88px))' }}
      >
        <div className="mx-auto w-full max-w-[430px] rounded-[16px] border border-white/10 bg-[#111827]/94 p-3 shadow-[0_16px_32px_rgba(2,6,23,0.34)] backdrop-blur-xl">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className={`flex h-[56px] w-full items-center justify-center gap-3 rounded-[12px] text-base font-black transition-all active:scale-[0.985] ${
              isAvailable
                ? 'bg-white text-slate-950'
                : 'cursor-not-allowed bg-white/10 text-white/46'
            }`}
          >
            {isAvailable ? <ShoppingBag size={20} /> : <CheckCircle2 size={20} />}
            <span>
              {isAvailable
                ? `${quantity} ta - ${(product.price * quantity).toLocaleString()} so'm`
                : isTemporarilyUnavailable
                  ? 'Hozircha mavjud emas'
                  : 'Tugagan'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
