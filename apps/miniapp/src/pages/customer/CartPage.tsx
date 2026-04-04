import React, { useEffect } from 'react';
import { ArrowLeft, ChevronRight, Clock, Minus, PackageCheck, Plus, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CartItemCard, UpsellProductCard } from '../../components/customer/CustomerComponents';
import { EmptyCartState } from '../../components/customer/CheckoutComponents';
import { useAddresses } from '../../hooks/queries/useAddresses';
import { useProducts } from '../../hooks/queries/useMenu';
import { useOrderQuote } from '../../hooks/queries/useOrders';
import { useAddressStore } from '../../store/useAddressStore';
import { useCartStore } from '../../store/useCartStore';
import { useCustomerLanguage } from '../../features/i18n/customerLocale';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { tr } = useCustomerLanguage();
  const { items, updateQuantity, removeFromCart, clearCart, getSubtotal, getDiscount, appliedPromo, syncWithProducts, addToCart } = useCartStore();
  const { selectedAddressId } = useAddressStore();
  const { data: addresses = [] } = useAddresses();
  const { data: products = [], isLoading: isProductsLoading, isError: isProductsError } = useProducts();

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) || null;
  
  const orderQuoteQuery = useOrderQuote({
    items: items.map((item) => ({ menuItemId: item.menuItemId ?? item.id, quantity: item.quantity })),
    deliveryAddressId: selectedAddress?.id ?? null,
    promoCode: appliedPromo?.code,
    enabled: Boolean(selectedAddress) && items.length > 0 && !isProductsLoading,
  });

  const totalPrice = orderQuoteQuery.data?.total ?? Math.max(0, subtotal - discount);
  const totalOldPrice = items.reduce((sum, item) => sum + (item.oldPrice || item.price) * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const upsellProducts = React.useMemo(() => {
    if (!products.length) return [];
    const keywords = ['sous', 'ichimlik', 'napitok', 'garnir', 'free', 'fri', 'kola', 'pepsi', 'fanta', 'sprite'];
    return products.filter((p) => {
      const name = p.name.toLowerCase();
      const inCart = items.some((item) => item.id === p.id);
      return !inCart && keywords.some((kw) => name.includes(kw));
    }).slice(0, 9);
  }, [products, items]);

  useEffect(() => {
    if (!isProductsLoading && !isProductsError) {
      syncWithProducts(products);
    }
  }, [isProductsError, isProductsLoading, products, syncWithProducts]);

  if (items.length === 0) return <EmptyCartState />;

  return (
    <div className="flex h-screen flex-col bg-[#1A1A1A] font-sans text-white">
      {/* FIXED HEADER (56px) */}
      <header className="flex h-[56px] shrink-0 items-center justify-between border-b border-[#333333] bg-[#1A1A1A] px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={() => navigate(-1)} className="flex h-6 w-6 items-center justify-center text-white active:scale-90">
            <ArrowLeft size={24} />
          </button>
          <h1 className="truncate text-[20px] font-semibold">Oqtepa Lavash</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end whitespace-nowrap">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-[#10B981]">{totalPrice.toLocaleString()}so'm</span>
              {totalOldPrice > totalPrice && (
                <span className="text-[12px] text-[#707070] line-through">{totalOldPrice.toLocaleString()} so'm</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[12px] text-[#A0A0A0]">
              <Clock size={12} />
              <span>15-25 daq</span>
              <span className="mx-1 opacity-40">•</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[#A0A0A0]">
            <Search size={20} className="active:text-white" />
            <button onClick={clearCart} className="active:text-white">
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN SCROLL AREA */}
      <main className="flex-1 overflow-y-auto scroll-smooth pb-4">
        {/* Product List */}
        <div className="flex flex-col">
          {items.map((item) => (
            <CartItemCard key={item.id} item={item} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} />
          ))}
        </div>

        {/* Menyuni ochish */}
        <div className="px-4 py-4">
          <button
            onClick={() => navigate('/customer')}
            className="flex h-[44px] w-full items-center justify-center rounded-[8px] border border-[#3A3A3A] bg-[#2D2D2D] text-[14px] font-medium text-white transition-all hover:bg-[#333333] active:scale-[0.98]"
          >
            Menyuni ochish
          </button>
        </div>

        {/* Recommendations Grid (3-column) */}
        {upsellProducts.length > 0 && (
          <section className="mt-5 px-4">
            <h2 className="mb-3 text-[16px] font-semibold">Yana nimadir kerakmi?</h2>
            <div className="grid grid-cols-3 gap-3">
              {upsellProducts.map((p) => (
                <UpsellProductCard key={p.id} product={p} onAdd={addToCart} />
              ))}
            </div>
          </section>
        )}

        {/* Plus Subscription Tip / Info (Optional in spec) */}
        <p className="mt-5 px-4 text-center text-[11px] leading-[14px] text-[#A0A0A0]">
          Yandex Plus obunasi bilan chegirmalar mavjud 💜 <br />
          /chegirmasiz: 6499sum
        </p>
      </main>

      {/* FIXED BOTTOM BAR (60px) */}
      <footer className="flex h-[60px] shrink-0 items-center gap-3 border-t border-[#333333] bg-[#1A1A1A] px-4">
        <button
          onClick={() => navigate('/customer/checkout')}
          className="flex h-[48px] flex-1 items-center justify-center gap-2 rounded-[24px] bg-[#A855F7] px-4 text-[14px] font-semibold text-white transition-all hover:bg-[#9333EA] active:scale-[0.98]"
        >
          <PackageCheck size={16} />
          <span>Bepul yetkazish</span>
        </button>

        <button
          onClick={() => navigate('/customer/checkout')}
          className="flex h-[48px] flex-1 items-center justify-center gap-2 rounded-[24px] bg-[#FFD700] px-4 text-[14px] font-semibold text-black transition-all hover:bg-[#FFC400] active:scale-[0.98]"
        >
          <span>To'lovga</span>
          <ChevronRight size={20} />
        </button>
      </footer>
    </div>
  );
};

export default CartPage;
