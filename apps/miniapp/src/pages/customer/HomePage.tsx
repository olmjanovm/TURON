import React from 'react';
import { Heart, MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  CategoryCard,
  HomePromoStrip,
  HomeProductRail,
  LoadingSkeleton,
} from '../../components/customer/CustomerComponents';
import { OrderStatus } from '../../data/types';
import { getLocalizedOrderStatusLabel, useCustomerLanguage } from '../../features/i18n/customerLocale';
import {
  buildCustomerHomeSections,
  getCustomerCategoryLabel,
  sortCustomerCategories,
} from '../../features/menu/customerCatalog';
import type { MenuCategory, MenuProduct } from '../../features/menu/types';
import { useAddresses } from '../../hooks/queries/useAddresses';
import { useCategories, useProducts } from '../../hooks/queries/useMenu';
import { useMyOrders } from '../../hooks/queries/useOrders';
import { useAddressStore } from '../../store/useAddressStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ProductAvailabilityEnum, ProductBadgeEnum } from '@turon/shared';

const PROMO_STRIP_LABELS = [
  { id: 'hot', label: 'Issiq taomlar', match: ['osh', "sho'rva", 'shorva'] },
  { id: 'pizza', label: 'Pitsalar', match: ['pitsa', 'pizza'] },
  { id: 'lavash', label: 'Lavashlar', match: ['lavash'] },
  { id: 'popular', label: "Eng ko'p sotilgan", match: ['fast food', 'kombo', 'combo'] },
  { id: 'bakery', label: 'Pishiriqlar', match: ['somsa', 'tort', 'cake'] },
];

const QUICK_CHIPS = [
  { id: 'chip-pitsa', label: 'Pitsalar', match: ['pitsa', 'pizza'] },
  { id: 'chip-lavash', label: 'Lavashlar', match: ['lavash'] },
  { id: 'chip-burger', label: 'Burgerlar', match: ['burger'] },
  { id: 'chip-donar', label: 'Donarlar', match: ['donar', 'doner', 'shawarma'] },
  { id: 'chip-drink', label: 'Ichimliklar', match: ['ichimlik', 'drink', 'juice', 'cola'] },
  { id: 'chip-sweet', label: 'Shirinliklar', match: ['shirinlik', 'dessert', 'desert', 'tort', 'cake'] },
];

const DEMO_CATEGORIES: MenuCategory[] = [
  {
    id: 'demo-fastfood',
    name: 'Fast food',
    slug: 'fast-food',
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-lavash',
    name: 'Lavash',
    slug: 'lavash',
    imageUrl: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-burger',
    name: 'Burger',
    slug: 'burger',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-donar',
    name: 'Donar',
    slug: 'donar',
    imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 4,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-pitsa',
    name: 'Pitsa',
    slug: 'pitsa',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-ichimlik',
    name: 'Ichimliklar',
    slug: 'ichimliklar',
    imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 6,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-shirinlik',
    name: 'Shirinliklar',
    slug: 'shirinliklar',
    imageUrl: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80',
    sortOrder: 7,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEMO_PRODUCTS: MenuProduct[] = [
  {
    id: 'demo-donar-1',
    categoryId: 'demo-donar',
    name: 'Klassik donar',
    description: "Mol go'shti, yangi sabzavot va maxsus sous bilan.",
    price: 32000,
    imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80',
    isActive: true,
    availability: ProductAvailabilityEnum.AVAILABLE,
    stockQuantity: 999,
    badge: ProductBadgeEnum.DISCOUNT,
    weight: '350 g',
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-lavash-1',
    categoryId: 'demo-lavash',
    name: 'Tovuq lavash',
    description: "Tovuq go'shti, pomidor va maxsus sous bilan.",
    price: 28000,
    imageUrl: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?auto=format&fit=crop&w=1200&q=80',
    isActive: true,
    availability: ProductAvailabilityEnum.AVAILABLE,
    stockQuantity: 999,
    badge: ProductBadgeEnum.DISCOUNT,
    weight: '330 g',
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-burger-1',
    categoryId: 'demo-burger',
    name: 'Chizburger',
    description: "Pishloqli burger, sabzavot va sous bilan.",
    price: 25000,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
    isActive: true,
    availability: ProductAvailabilityEnum.AVAILABLE,
    stockQuantity: 999,
    badge: ProductBadgeEnum.POPULAR,
    weight: '240 g',
    sortOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-pitsa-1',
    categoryId: 'demo-pitsa',
    name: 'Pitsa pepperoni',
    description: "Mozzarella, pepperoni va pomidor sous.",
    price: 69000,
    imageUrl: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80',
    isActive: true,
    availability: ProductAvailabilityEnum.AVAILABLE,
    stockQuantity: 999,
    badge: ProductBadgeEnum.NEW,
    weight: '35 sm',
    sortOrder: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-drink-1',
    categoryId: 'demo-ichimlik',
    name: 'Pepsi 1.5L',
    description: 'Sovuq gazli ichimlik.',
    price: 16000,
    imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80',
    isActive: true,
    availability: ProductAvailabilityEnum.AVAILABLE,
    stockQuantity: 999,
    badge: ProductBadgeEnum.POPULAR,
    weight: '1.5 L',
    sortOrder: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-somsa-1',
    categoryId: 'demo-fastfood',
    name: 'Somsa',
    description: "Qiyma goshtli issiq somsa.",
    price: 9000,
    imageUrl: 'https://images.unsplash.com/photo-1542826438-4c8b6f1f27a0?auto=format&fit=crop&w=1200&q=80',
    isActive: true,
    availability: ProductAvailabilityEnum.AVAILABLE,
    stockQuantity: 999,
    badge: ProductBadgeEnum.NEW,
    weight: '1 dona',
    sortOrder: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-tort-1',
    categoryId: 'demo-shirinlik',
    name: 'Tort',
    description: "Shirin kremli tort bo'lagi.",
    price: 18000,
    imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1200&q=80',
    isActive: true,
    availability: ProductAvailabilityEnum.AVAILABLE,
    stockQuantity: 999,
    badge: ProductBadgeEnum.NEW,
    weight: '150 g',
    sortOrder: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-ice-1',
    categoryId: 'demo-shirinlik',
    name: 'Muzqaymoq',
    description: "Sovuq muzqaymoq, yozgi ta'm.",
    price: 12000,
    imageUrl: 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=1200&q=80',
    isActive: true,
    availability: ProductAvailabilityEnum.AVAILABLE,
    stockQuantity: 999,
    badge: ProductBadgeEnum.POPULAR,
    weight: '120 g',
    sortOrder: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[´`']/g, '')
    .replace(/\s+/g, ' ');

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { formatText, language } = useCustomerLanguage();
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();
  const { data: products = [], isLoading: isProductsLoading } = useProducts();
  const { data: addresses = [] } = useAddresses();
  const { data: orders = [] } = useMyOrders();
  const { selectedAddressId } = useAddressStore();

  const firstName =
    (user as { firstName?: string; name?: string; fullName?: string } | null)?.firstName ||
    (user as { firstName?: string; name?: string; fullName?: string } | null)?.name ||
    (user as { firstName?: string; name?: string; fullName?: string } | null)?.fullName?.split(' ')[0] ||
    'Mijoz';

  const baseCategories = categories.length ? categories : DEMO_CATEGORIES;
  const baseProducts = products.length ? products : DEMO_PRODUCTS;
  const sortedCategories = React.useMemo(() => sortCustomerCategories(baseCategories), [baseCategories]);
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) || addresses[0];
  const activeOrder = orders.find(
    (order) => order.orderStatus !== OrderStatus.DELIVERED && order.orderStatus !== OrderStatus.CANCELLED,
  );
  const sections = React.useMemo(() => buildCustomerHomeSections(baseProducts), [baseProducts]);

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return `Xayrli tong, ${formatText(firstName)}`;
    if (hour < 18) return `Xayrli kun, ${formatText(firstName)}`;
    return `Xayrli kech, ${formatText(firstName)}`;
  }, [firstName, formatText]);

  const promoItems = React.useMemo(() => {
    const normalized = sortedCategories.map((category) => ({
      category,
      label: normalize(getCustomerCategoryLabel(category.name)),
    }));

    return PROMO_STRIP_LABELS.map((item) => {
      const match = normalized.find((entry) => item.match.some((token) => entry.label.includes(token)));
      return {
        id: item.id,
        label: item.label,
        targetPath: match ? `/customer/category/${match.category.id}` : '/customer/search',
      };
    });
  }, [sortedCategories]);

  const quickChips = React.useMemo(() => {
    const normalized = sortedCategories.map((category) => ({
      category,
      label: normalize(getCustomerCategoryLabel(category.name)),
    }));

    return QUICK_CHIPS.map((chip) => {
      const match = normalized.find((entry) => chip.match.some((token) => entry.label.includes(token)));
      return {
        id: chip.id,
        label: chip.label,
        targetPath: match ? `/customer/category/${match.category.id}` : '/customer/search',
      };
    });
  }, [sortedCategories]);

  if (isCategoriesLoading || isProductsLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div
      className="min-h-screen animate-in fade-in duration-500"
      style={{ paddingBottom: 'calc(var(--customer-floating-content-clearance, 164px) + 16px)' }}
    >
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/8 bg-[#0b1220]/96 backdrop-blur-xl">
        <div className="mx-auto flex h-[64px] w-full max-w-[430px] items-center justify-between px-4">
          <h1 className="text-[18px] font-semibold text-white">Turon Bot</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/customer/search')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white"
            >
              <Search size={18} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/customer/favorites')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white"
            >
              <Heart size={18} />
            </button>
          </div>
        </div>
      </header>

      <section className="px-4 pb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 72px)' }}>
        <button
          type="button"
          onClick={() => navigate('/customer/addresses')}
          className="flex h-[48px] w-full items-center gap-3 rounded-[12px] border border-white/10 bg-white/[0.04] px-3 text-left"
        >
          <div className="flex h-6 w-6 items-center justify-center text-white/80">
            <MapPin size={16} />
          </div>
          <span className="text-[13px] font-medium text-white/80">
            {selectedAddress ? formatText(selectedAddress.addressText) : 'Xaritada tanlangan nuqta'}
          </span>
        </button>

        <div className="mt-3">
          <p className="text-[20px] font-bold leading-tight text-white">{greeting}</p>
          <p className="mt-1 text-[14px] text-white/65">Turon kafesiga xush kelibsiz</p>
        </div>

        <div className="mt-4">
          <HomePromoStrip items={promoItems} />
        </div>

        <div className="scrollbar-hide -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {quickChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => navigate(chip.targetPath)}
              className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-[12px] font-semibold text-white/85"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {activeOrder ? (
          <button
            type="button"
            onClick={() => navigate(`/customer/orders/${activeOrder.id}`)}
            className="mt-4 flex w-full items-center justify-between rounded-[12px] border border-white/10 bg-white/[0.04] px-3 py-2 text-left"
          >
            <div>
              <p className="text-[11px] font-semibold text-white/60">Faol buyurtma</p>
              <p className="mt-1 text-[13px] font-semibold text-white">#{activeOrder.orderNumber}</p>
              <p className="mt-1 text-[12px] text-white/55">
                {getLocalizedOrderStatusLabel(activeOrder.orderStatus, language)}
              </p>
            </div>
            <span className="text-[11px] font-semibold text-white/70">Batafsil</span>
          </button>
        ) : null}
      </section>

      <section className="px-4 pt-4">
        <h2 className="text-[16px] font-bold text-white">Menyu bo'limlari</h2>
        <div className="scrollbar-hide -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
          {sortedCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      <section className="px-4 pt-5">
        <div>
          <h2 className="text-[16px] font-bold text-white">Aksiya</h2>
          <p className="mt-1 text-[12px] text-white/50">Chegirmadagi taomlar</p>
        </div>
        <div className="mt-3">
          <HomeProductRail products={sections.discounted} />
        </div>
      </section>

      <section className="px-4 pt-5">
        <h2 className="text-[16px] font-bold text-white">Ommabop</h2>
        <div className="mt-3">
          <HomeProductRail products={sections.popular} />
        </div>
      </section>

      <section className="px-4 pt-5">
        <h2 className="text-[16px] font-bold text-white">Yangi</h2>
        <div className="mt-3">
          <HomeProductRail products={sections.newest} />
        </div>
      </section>
    </div>
  );
};

export default HomePage;
