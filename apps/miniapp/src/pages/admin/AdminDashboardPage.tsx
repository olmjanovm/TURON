import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  Bike,
  ClipboardList,
  Loader2,
  RefreshCw,
  Search,
  Tag,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react';
import { OrderStatusEnum, PaymentStatusEnum } from '@turon/shared';
import { useAdminOrders } from '../../hooks/queries/useOrders';
import { useAdminCourierDirectory } from '../../hooks/queries/useCouriers';
import { useOrdersStore } from '../../store/useOrdersStore';

function formatCompactMoney(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  }

  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }

  return value.toString();
}

function formatOrderTime(timestamp: string) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000));

  if (minutes < 60) {
    return `${minutes} min oldin`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours} soat oldin`;
}

const StatCard: React.FC<{
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  iconClassName: string;
}> = ({ title, value, hint, icon, iconClassName }) => (
  <article className="rounded-[20px] bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
    <div className="flex items-start justify-between gap-3">
      <p className="text-[13px] font-semibold text-slate-500">{title}</p>
      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${iconClassName}`}>
        {icon}
      </div>
    </div>
    <p className="mt-2 text-2xl font-black leading-none tracking-tight text-slate-950">{value}</p>
    <p className="mt-2 text-xs font-semibold text-slate-500">{hint}</p>
  </article>
);

const QuickAction: React.FC<{
  label: string;
  icon: React.ReactNode;
  badge?: number;
  onClick: () => void;
}> = ({ label, icon, badge, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="relative flex h-[92px] flex-col items-center justify-center gap-3 rounded-[16px] bg-white text-slate-950 shadow-[0_16px_34px_rgba(15,23,42,0.07)] active:scale-[0.98]"
  >
    {badge ? (
      <span className="absolute right-3 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-black text-white">
        {badge}
      </span>
    ) : null}
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
      {icon}
    </span>
    <span className="text-sm font-black">{label}</span>
  </button>
);

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const storeOrders = useOrdersStore((state) => state.orders);

  const {
    data: adminOrders = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useAdminOrders();
  const { data: couriers = [] } = useAdminCourierDirectory();

  const orders = adminOrders.length > 0 ? adminOrders : storeOrders;
  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.orderStatus !== OrderStatusEnum.DELIVERED &&
          order.orderStatus !== OrderStatusEnum.CANCELLED,
      ),
    [orders],
  );
  const liveOrders = activeOrders.slice(0, 3);
  const newOrders = orders.filter((order) => order.orderStatus === OrderStatusEnum.PENDING);
  const pendingOrders = orders.filter(
    (order) =>
      order.orderStatus === OrderStatusEnum.PENDING ||
      order.paymentStatus === PaymentStatusEnum.PENDING,
  );
  const deliveredRevenue = orders
    .filter((order) => order.orderStatus === OrderStatusEnum.DELIVERED)
    .reduce((sum, order) => sum + order.total, 0);
  const onlineCouriers = couriers.filter((courier) => courier.isOnline).length;
  const busyCouriers = couriers.filter((courier) => courier.activeAssignments > 0).length;
  const cancelledOrder = orders.find((order) => order.orderStatus === OrderStatusEnum.CANCELLED);

  return (
    <div className="space-y-6 pb-6">
      <section className="grid grid-cols-2 gap-3">
        <StatCard
          title="Yangi buyurtmalar"
          value={newOrders.length.toString()}
          hint="+3 oxirgi soatda"
          icon={<ClipboardList size={16} />}
          iconClassName="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Bugungi daromad"
          value={formatCompactMoney(deliveredRevenue || orders.reduce((sum, order) => sum + order.total, 0))}
          hint="UZS +8% kechagidan"
          icon={<TrendingUp size={16} />}
          iconClassName="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Faol kuryerlar"
          value={`${onlineCouriers} / ${couriers.length || 6}`}
          hint={`${onlineCouriers} online, ${busyCouriers} band`}
          icon={<Bike size={16} />}
          iconClassName="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Kutilayotganlar"
          value={pendingOrders.length.toString()}
          hint="Harakat kutmoqda"
          icon={<Bell size={16} />}
          iconClassName="bg-red-50 text-red-500"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-black tracking-tight text-slate-950">Tezkor amallar</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <QuickAction
            label="Buyurtmalar"
            icon={<ClipboardList size={20} />}
            badge={newOrders.length || undefined}
            onClick={() => navigate('/admin/orders')}
          />
          <QuickAction label="Menu" icon={<UtensilsCrossed size={20} />} onClick={() => navigate('/admin/menu')} />
          <QuickAction
            label="Kuryerlar"
            icon={<Bike size={20} />}
            badge={busyCouriers || undefined}
            onClick={() => navigate('/admin/couriers')}
          />
          <QuickAction label="Promo" icon={<Tag size={20} />} onClick={() => navigate('/admin/promos')} />
          <QuickAction label="Hisobotlar" icon={<TrendingUp size={20} />} onClick={() => navigate('/admin/reports')} />
          <QuickAction
            label="Xabarlar"
            icon={<Bell size={20} />}
            badge={pendingOrders.length || undefined}
            onClick={() => navigate('/admin/notifications')}
          />
        </div>
      </section>

      {isError ? (
        <button
          type="button"
          onClick={() => refetch()}
          className="flex w-full items-center justify-between rounded-[16px] border border-amber-300 bg-amber-50 px-4 py-4 text-left"
        >
          <span className="flex items-center gap-3">
            <AlertTriangle size={18} className="text-amber-500" />
            <span>
              <span className="block text-sm font-black text-slate-950">Ma'lumotlar ulanmayapti</span>
              <span className="block text-xs font-semibold text-slate-500">Qayta yuklash uchun bosing</span>
            </span>
          </span>
          <RefreshCw size={18} className="text-slate-500" />
        </button>
      ) : (
        <div className="rounded-[16px] border border-amber-300 bg-amber-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 text-amber-500" />
            <div>
              <p className="text-sm font-black text-slate-950">
                {cancelledOrder ? `Buyurtma #${cancelledOrder.orderNumber} bekor qilindi` : 'Buyurtmalar nazoratda'}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {cancelledOrder ? `Mijoz bekor qildi ${formatOrderTime(cancelledOrder.createdAt)}` : 'Yangi ogohlantirishlar shu yerda chiqadi'}
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight text-slate-950">Jonli buyurtmalar</h2>
          <button
            type="button"
            onClick={() => navigate('/admin/orders')}
            className="flex items-center gap-1 text-sm font-bold text-blue-600"
          >
            Hammasi
            <span aria-hidden="true">›</span>
          </button>
        </div>

        {isLoading && orders.length === 0 ? (
          <div className="flex items-center justify-center rounded-[18px] bg-white py-8 text-slate-500 shadow-[0_16px_34px_rgba(15,23,42,0.07)]">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : null}

        {!isLoading && liveOrders.length === 0 ? (
          <div className="rounded-[18px] bg-white p-5 text-center shadow-[0_16px_34px_rgba(15,23,42,0.07)]">
            <Search size={22} className="mx-auto text-slate-400" />
            <p className="mt-2 text-sm font-black text-slate-950">Faol buyurtma yo'q</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Yangi buyurtmalar kelganda shu yerda ko'rinadi.</p>
          </div>
        ) : null}

        {liveOrders.map((order) => (
          <button
            key={order.id}
            type="button"
            onClick={() => navigate(`/admin/orders/${order.id}`)}
            className="w-full rounded-[18px] bg-white p-4 text-left shadow-[0_16px_34px_rgba(15,23,42,0.07)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-black text-slate-950">#{order.orderNumber}</p>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-600">
                    Yangi
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-500">{order.customerName || 'Mijoz'}</p>
              </div>
              <div className="text-right">
                <p className="text-base font-black text-slate-950">{order.total.toLocaleString()} UZS</p>
                <p className="mt-2 text-xs font-semibold text-slate-500">{formatOrderTime(order.createdAt)}</p>
              </div>
            </div>
          </button>
        ))}

        {isFetching ? (
          <p className="text-center text-xs font-semibold text-slate-400">Sinxronlanyapti...</p>
        ) : null}
      </section>
    </div>
  );
};

export default AdminDashboardPage;
