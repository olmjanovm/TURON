import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Clock3,
  LayoutDashboard,
  Loader2,
  Plus,
  RefreshCw,
  ShoppingBag,
  FileSpreadsheet,
  Tag,
  UtensilsCrossed,
} from 'lucide-react';
import { OrderStatusEnum, PaymentStatusEnum, ProductAvailabilityEnum } from '@turon/shared';
import { useAdminOrders } from '../../hooks/queries/useOrders';
import { useAdminCategories, useAdminProducts } from '../../hooks/queries/useMenu';
import { useAdminPromos } from '../../hooks/queries/usePromos';
import { useOrdersStore } from '../../store/useOrdersStore';
import { TimeRange } from '../../features/analytics/types';
import {
  calculateKPIMetrics,
  filterOrdersByTimeRange,
  getCourierPerformance,
  getOrderStatusBreakdown,
  getPromoInsights,
  getRecentActivity,
  getTopProducts,
} from '../../features/analytics/analyticsHelpers';
import { AnalyticsFilterBar } from '../../features/analytics/components/AnalyticsFilterBar';
import { KPIStatCards } from '../../features/analytics/components/KPIStatCards';
import { StatusBreakdownCard } from '../../features/analytics/components/StatusBreakdownCard';
import { TopProductsCard } from '../../features/analytics/components/TopProductsCard';
import { CourierPerformanceCard } from '../../features/analytics/components/CourierPerformanceCard';
import { PromoInsightsCard } from '../../features/analytics/components/PromoInsightsCard';
import { RecentActivityCard } from '../../features/analytics/components/RecentActivityCard';

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  TODAY: 'Bugungi nazorat',
  THIS_WEEK: 'Haftalik nazorat',
  THIS_MONTH: 'Oylik nazorat',
  ALL_TIME: 'Umumiy nazorat',
};

function formatSyncTime(timestamp?: number) {
  if (!timestamp) {
    return 'hozircha yo\'q';
  }

  return new Date(timestamp).toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isPromoActiveNow(promo: { isActive: boolean; startDate: string; endDate?: string }) {
  if (!promo.isActive) {
    return false;
  }

  const now = new Date();
  const startDate = new Date(promo.startDate);
  const endDate = promo.endDate ? new Date(promo.endDate) : null;

  return startDate <= now && (!endDate || endDate >= now);
}

interface SummaryCardProps {
  accentClass: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  onClick?: () => void;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  accentClass,
  icon,
  label,
  value,
  hint,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="bg-white rounded-[26px] border border-slate-100 shadow-sm p-4 text-left transition-transform active:scale-[0.98]"
  >
    <div className="flex items-start justify-between gap-3">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${accentClass}`}>
        {icon}
      </div>
      <ArrowUpRight size={18} className="text-slate-300" />
    </div>
    <div className="mt-5">
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-3xl font-black tracking-tight text-slate-900 mt-2 leading-none">{value}</p>
      <p className="text-xs font-bold text-slate-500 mt-2">{hint}</p>
    </div>
  </button>
);

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const QuickActionButton: React.FC<QuickActionProps> = ({
  icon,
  title,
  description,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-4 text-left transition-transform active:scale-[0.98]"
  >
    <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
      {icon}
    </div>
    <p className="text-sm font-black text-slate-900 mt-4">{title}</p>
    <p className="text-xs font-bold text-slate-500 mt-1 leading-relaxed">{description}</p>
  </button>
);

interface PlaceholderCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const PlaceholderCard: React.FC<PlaceholderCardProps> = ({ icon, title, description }) => (
  <div className="bg-white rounded-[28px] p-5 shadow-sm border border-dashed border-slate-200">
    <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
      {icon}
    </div>
    <h3 className="text-base font-black text-slate-900 mt-4">{title}</h3>
    <p className="text-sm font-bold text-slate-500 mt-2 leading-relaxed">{description}</p>
  </div>
);

const DashboardSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-44 rounded-[32px] bg-slate-200" />
    <div className="h-12 rounded-2xl bg-slate-200" />
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className={`rounded-[24px] bg-slate-200 ${index === 0 ? 'col-span-2 h-40' : 'h-28'}`}
        />
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="h-56 rounded-[28px] bg-slate-200" />
      <div className="h-56 rounded-[28px] bg-slate-200" />
    </div>
  </div>
);

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('TODAY');

  const storeOrders = useOrdersStore((state) => state.orders);
  const { data: categories = [] } = useAdminCategories();
  const { data: products = [] } = useAdminProducts();
  const { data: promos = [] } = useAdminPromos();

  const {
    data: adminOrders = [],
    isLoading,
    isError,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = useAdminOrders();

  const useFallbackOrders = (isLoading || isError) && storeOrders.length > 0;
  const orders = useFallbackOrders ? storeOrders : adminOrders;

  const filteredOrders = useMemo(
    () => filterOrdersByTimeRange(orders, timeRange),
    [orders, timeRange],
  );

  const analyticsData = useMemo(() => ({
    kpi: calculateKPIMetrics(filteredOrders),
    statusBreakdown: getOrderStatusBreakdown(filteredOrders),
    topProducts: getTopProducts(filteredOrders),
    courierPerformance: getCourierPerformance(filteredOrders),
    promoInsights: getPromoInsights(filteredOrders, promos),
    recentActivity: getRecentActivity(filteredOrders),
  }), [filteredOrders, promos]);

  const activeCategories = useMemo(
    () => categories.filter((category) => category.isActive).length,
    [categories],
  );

  const activeProducts = useMemo(
    () => products.filter((product) => product.isActive).length,
    [products],
  );

  const availableProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.isActive && product.availability === ProductAvailabilityEnum.AVAILABLE,
      ).length,
    [products],
  );

  const activePromos = useMemo(
    () => promos.filter((promo) => isPromoActiveNow(promo)).length,
    [promos],
  );

  const exhaustedPromos = useMemo(
    () =>
      promos.filter((promo) => {
        const usageLimit = promo.usageLimit ?? 0;
        return usageLimit > 0 && promo.timesUsed >= usageLimit;
      }).length,
    [promos],
  );

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.orderStatus === OrderStatusEnum.PENDING).length,
    [orders],
  );

  const readyForPickupOrders = useMemo(
    () => orders.filter((order) => order.orderStatus === OrderStatusEnum.READY_FOR_PICKUP).length,
    [orders],
  );

  const deliveringOrders = useMemo(
    () => orders.filter((order) => order.orderStatus === OrderStatusEnum.DELIVERING).length,
    [orders],
  );

  const verifiedPayments = useMemo(
    () => orders.filter((order) => order.paymentStatus === PaymentStatusEnum.COMPLETED).length,
    [orders],
  );

  const activeCourierCount = useMemo(() => {
    const courierIds = orders
      .filter(
        (order) =>
          order.courierId &&
          order.orderStatus !== OrderStatusEnum.DELIVERED &&
          order.orderStatus !== OrderStatusEnum.CANCELLED,
      )
      .map((order) => order.courierId as string);

    return new Set(courierIds).size;
  }, [orders]);

  const activeOrderHint = pendingOrders > 0
    ? `${pendingOrders} ta yangi buyurtma tasdiq kutmoqda`
    : 'Yangi buyurtmalar nazorat ostida';

  const syncBadgeLabel = useFallbackOrders
    ? 'Mahalliy snapshot'
    : isFetching
      ? 'Sinxronlanyapti'
      : `Yangilandi ${formatSyncTime(dataUpdatedAt)}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <section className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white shadow-2xl shadow-slate-300/40 overflow-hidden relative">
        <div className="absolute -top-16 -right-12 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -left-10 w-32 h-32 rounded-full bg-sky-400/20 blur-2xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="max-w-[75%]">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-300">
              Admin Dashboard
            </p>
            <h2 className="text-3xl font-black tracking-tight leading-none mt-3">
              Restoran nazorati bir ekranda
            </h2>
            <p className="text-sm font-bold text-slate-300 mt-3 leading-relaxed">
              Buyurtmalar oqimi, menyu holati va promo faolligini jonli kuzatish uchun asosiy panel.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform"
            aria-label="Dashboardni yangilash"
          >
            {isFetching ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
          </button>
        </div>

        <div className="relative grid grid-cols-2 gap-3 mt-6">
          <div className="rounded-[24px] bg-white/10 border border-white/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-300">
              Jarayondagi buyurtmalar
            </p>
            <p className="text-4xl font-black leading-none mt-3">{analyticsData.kpi.activeOrders}</p>
            <p className="text-xs font-bold text-slate-300 mt-2">{activeOrderHint}</p>
          </div>
          <div className="rounded-[24px] bg-emerald-400/15 border border-emerald-300/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-100">
              Yetkazilgan daromad
            </p>
            <p className="text-3xl font-black leading-none mt-3">
              {analyticsData.kpi.totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs font-bold text-emerald-100/80 mt-2">
              {analyticsData.kpi.deliveredOrders} ta yakunlangan buyurtma
            </p>
          </div>
        </div>

        <div className="relative flex flex-wrap items-center gap-2 mt-5">
          <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-[0.24em] text-slate-200">
            {TIME_RANGE_LABELS[timeRange]}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-sky-400/15 border border-sky-300/10 text-[10px] font-black uppercase tracking-[0.24em] text-sky-100">
            {syncBadgeLabel}
          </span>
          <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-[0.24em] text-slate-300">
            {activeCourierCount} ta faol kuryer
          </span>
        </div>
      </section>

      {isError && useFallbackOrders ? (
        <div className="bg-amber-50 border border-amber-200 rounded-[24px] p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-sm font-black text-amber-900">API vaqtincha ulanmayapti</p>
            <p className="text-xs font-bold text-amber-700 mt-1 leading-relaxed">
              Dashboard mahalliy saqlangan buyurtmalar bilan ishlayapti. Ma&apos;lumotlar qayta ulanilganda avtomatik yangilanadi.
            </p>
          </div>
        </div>
      ) : null}

      {isLoading && storeOrders.length === 0 ? <DashboardSkeleton /> : null}

      {!isLoading || storeOrders.length > 0 ? (
        <>
          {isError && !useFallbackOrders ? (
            <div className="bg-white rounded-[28px] border border-rose-100 shadow-sm p-5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-4">Dashboard yuklanmadi</h3>
              <p className="text-sm font-bold text-slate-500 mt-2 leading-relaxed">
                Admin buyurtmalarini olishda xatolik yuz berdi. Qayta urinib ko&apos;ring.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-4 h-11 px-5 rounded-2xl bg-slate-900 text-white text-sm font-black uppercase tracking-wide"
              >
                Qayta yuklash
              </button>
            </div>
          ) : null}

          {!isError || useFallbackOrders ? (
            <>
              <AnalyticsFilterBar timeRange={timeRange} onChange={setTimeRange} />

              <KPIStatCards metrics={analyticsData.kpi} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SummaryCard
                  accentClass="bg-blue-50 text-blue-600"
                  icon={<ShoppingBag size={20} />}
                  label="Buyurtmalar"
                  value={pendingOrders.toString()}
                  hint={`${readyForPickupOrders} ta pickupga tayyor`}
                  onClick={() => navigate('/admin/orders')}
                />
                <SummaryCard
                  accentClass="bg-emerald-50 text-emerald-600"
                  icon={<UtensilsCrossed size={20} />}
                  label="Menyu"
                  value={activeProducts.toString()}
                  hint={`${availableProducts} ta mahsulot sotuvda, ${activeCategories} ta kategoriya faol`}
                  onClick={() => navigate('/admin/menu')}
                />
                <SummaryCard
                  accentClass="bg-indigo-50 text-indigo-600"
                  icon={<Tag size={20} />}
                  label="Promolar"
                  value={activePromos.toString()}
                  hint={`${exhaustedPromos} ta promo limitga yetgan`}
                  onClick={() => navigate('/admin/promos')}
                />
                <SummaryCard
                  accentClass="bg-amber-50 text-amber-600"
                  icon={<Banknote size={20} />}
                  label="To'lovlar"
                  value={verifiedPayments.toString()}
                  hint={`${deliveringOrders} ta buyurtma yetkazilmoqda`}
                  onClick={() => navigate('/admin/orders')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analyticsData.statusBreakdown.length > 0 ? (
                  <StatusBreakdownCard
                    breakdown={analyticsData.statusBreakdown}
                    totalOrders={analyticsData.kpi.totalOrders}
                  />
                ) : (
                  <PlaceholderCard
                    icon={<LayoutDashboard size={20} />}
                    title="Status tahlili hali shakllanmadi"
                    description="Tanlangan davrda buyurtma bo'lmagani uchun status bo'yicha bo'linma hozircha ko'rsatilmaydi."
                  />
                )}

                {analyticsData.recentActivity.length > 0 ? (
                  <RecentActivityCard activities={analyticsData.recentActivity} />
                ) : (
                  <PlaceholderCard
                    icon={<Clock3 size={20} />}
                    title="So'nggi harakatlar bo'sh"
                    description="Yangi buyurtma yoki to'lov hodisasi paydo bo'lganda bu yerda real vaqt lentasi ko'rinadi."
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analyticsData.topProducts.length > 0 ? (
                  <TopProductsCard products={analyticsData.topProducts} />
                ) : (
                  <PlaceholderCard
                    icon={<UtensilsCrossed size={20} />}
                    title="Top mahsulotlar tayyor emas"
                    description="Sotuv bo'lgach eng ko'p buyurtma qilingan mahsulotlar shu kartada paydo bo'ladi."
                  />
                )}

                {analyticsData.promoInsights.length > 0 ? (
                  <PromoInsightsCard insights={analyticsData.promoInsights} />
                ) : (
                  <PlaceholderCard
                    icon={<Tag size={20} />}
                    title="Promo tahlili kutilyapti"
                    description="Faol promolar mavjud, ammo hali foydalanish statistikasi shakllanmagan."
                  />
                )}
              </div>

              {analyticsData.courierPerformance.length > 0 ? (
                <CourierPerformanceCard performance={analyticsData.courierPerformance} />
              ) : (
                <PlaceholderCard
                  icon={<ShoppingBag size={20} />}
                  title="Kuryer faolligi hali yo'q"
                  description="Kuryerga biriktirilgan buyurtmalar paydo bo'lgach ushbu blokda yetkazib berish samaradorligi ko'rsatiladi."
                />
              )}
            </>
          ) : null}
        </>
      ) : null}

      <section className="space-y-3 pt-2">
        <div className="px-1">
          <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-400">
            Tezkor amallar
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <QuickActionButton
            icon={<ShoppingBag size={20} />}
            title="Buyurtmalar"
            description="Yangi va faol buyurtmalarni boshqarish"
            onClick={() => navigate('/admin/orders')}
          />
          <QuickActionButton
            icon={<Plus size={20} />}
            title="Yangi mahsulot"
            description="Menyuga yangi taom yoki ichimlik qo'shish"
            onClick={() => navigate('/admin/menu/products/new')}
          />
          <QuickActionButton
            icon={<UtensilsCrossed size={20} />}
            title="Menyu boshqaruvi"
            description="Kategoriya va mahsulot tarkibini nazorat qilish"
            onClick={() => navigate('/admin/menu')}
          />
          <QuickActionButton
            icon={<Tag size={20} />}
            title="Promokod yaratish"
            description="Yangi aksiya yoki chegirma kodini ishga tushirish"
            onClick={() => navigate('/admin/promos/new')}
          />
          <QuickActionButton
            icon={<FileSpreadsheet size={20} />}
            title="Xisobotlar"
            description="Daromad va buyurtmalar statistikasi (Excel)"
            onClick={() => navigate('/admin/reports')}
          />
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
