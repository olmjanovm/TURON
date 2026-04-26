import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bike,
  Clock,
  ShoppingBag,
  Store,
  TrendingUp,
  UtensilsCrossed,
} from 'lucide-react';
import { OrderStatusEnum, PaymentStatusEnum } from '@turon/shared';
import type { Order } from '../../data/types';
import { useAdminOrders } from '../../hooks/queries/useOrders';
import { useAdminCourierDirectory } from '../../hooks/queries/useCouriers';
import { useOrdersStore } from '../../store/useOrdersStore';

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatMoney(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return value.toString();
}

const UZ_DAYS = [
  'Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba',
];
const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

function getTodayLabel(): string {
  const d = new Date();
  return `${UZ_DAYS[d.getDay()]}, ${d.getDate()} ${UZ_MONTHS[d.getMonth()]}`;
}

function padTwo(n: number): string {
  return n.toString().padStart(2, '0');
}

function useLiveClock(): string {
  const [t, setT] = useState(() => {
    const d = new Date();
    return `${padTwo(d.getHours())}:${padTwo(d.getMinutes())}`;
  });
  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setT(`${padTwo(d.getHours())}:${padTwo(d.getMinutes())}`);
    }, 30_000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'Hozir';
  if (mins < 60) return `${mins}d`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}s`;
  return `${Math.floor(hrs / 24)}k`;
}

function getOrderInitials(order: Order): string {
  if (order.customerName?.trim()) {
    return order.customerName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0] ?? '')
      .join('')
      .toUpperCase();
  }
  return (order.orderNumber ?? order.id).slice(-2).toUpperCase();
}

type StatusInfo = { dot: string; label: string; bg: string };

function getStatusInfo(status: string): StatusInfo {
  if (status === (OrderStatusEnum.PENDING as string))
    return { dot: '#D4891A', label: 'Yangi', bg: 'rgba(212,137,26,0.1)' };
  if (status === (OrderStatusEnum.DELIVERED as string))
    return { dot: '#276749', label: 'Yetkazildi', bg: 'rgba(39,103,73,0.1)' };
  return { dot: '#2B6CB0', label: 'Jarayonda', bg: 'rgba(43,108,176,0.1)' };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton: React.FC = () => (
  <div className="space-y-4 pb-32">
    <div className="h-[72px] rounded-[18px] bg-white/80 animate-pulse" />
    <div className="admin-hero-card rounded-[28px] p-6">
      <div className="animate-pulse space-y-4">
        <div className="flex justify-between">
          <div className="h-4 w-28 rounded-full bg-black/10" />
          <div className="h-6 w-16 rounded-full bg-black/8" />
        </div>
        <div className="pt-3 border-t border-black/10 space-y-2">
          <div className="h-3 w-24 rounded-full bg-black/8" />
          <div className="h-12 w-40 rounded-xl bg-black/12" />
          <div className="h-3 w-32 rounded-full bg-black/8" />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[88px] rounded-[20px] bg-white animate-pulse" />
      ))}
    </div>
    <div className="admin-pro-card p-5 space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-black/5 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 rounded-full bg-black/5" />
            <div className="h-2.5 w-16 rounded-full bg-black/4" />
          </div>
          <div className="h-3 w-14 rounded-full bg-black/5" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Zone 1: Alert ────────────────────────────────────────────────────────────

const AlertBanner: React.FC<{ count: number; onClick: () => void }> = ({
  count,
  onClick,
}) => (
  <button type="button" onClick={onClick} className="zone-alert admin-alert-banner w-full">
    <span className="admin-alert-dot" />
    <span className="flex-1 text-left font-semibold">
      <strong className="font-black">{count} ta buyurtma</strong> tasdiq kutmoqda
    </span>
    <ArrowRight size={15} className="shrink-0 opacity-70" />
  </button>
);

// ─── Zone 3a: Pending Hero (2× visual weight when urgent) ─────────────────────

const PendingHero: React.FC<{ count: number; onClick: () => void }> = ({
  count,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="stat-card w-full rounded-[20px] border-2 bg-white p-5 flex items-center gap-4 active:scale-[0.98] transition-transform"
    style={
      {
        '--i': 0,
        borderColor: 'rgba(197, 48, 48, 0.22)',
        boxShadow: '0 2px 12px rgba(197,48,48,0.08), 0 4px 20px rgba(197,48,48,0.05)',
      } as React.CSSProperties
    }
  >
    <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl bg-[var(--admin-danger)]">
      <span className="text-[40px] font-black leading-none text-white tabular-nums">
        {count > 99 ? '99+' : count}
      </span>
    </div>
    <div className="flex-1 min-w-0 text-left">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--admin-danger)] mb-1">
        Acil
      </p>
      <p className="text-[18px] font-black text-[var(--admin-pro-text)] leading-tight">
        Tasdiq kutmoqda
      </p>
      <p className="text-[12px] text-[var(--admin-pro-text-muted)] mt-1">
        Hozir ko'rish uchun bosing
      </p>
    </div>
    <ArrowRight size={20} className="text-[var(--admin-danger)] shrink-0" />
  </button>
);

// ─── Zone 3b: Stat Card (secondary stats) ─────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  dot: string;
  index: number;
  onClick: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, dot, index, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="stat-card admin-pro-card flex w-full flex-col items-center justify-center gap-1.5 rounded-[20px] py-4 active:scale-95 transition-transform"
    style={{ '--i': index } as React.CSSProperties}
  >
    <span
      className="text-[28px] font-black tabular-nums text-[var(--admin-pro-text)] leading-none"
    >
      {value}
    </span>
    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--admin-pro-text-muted)]">
      {label}
    </span>
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: dot,
        boxShadow: `0 0 6px ${dot}88`,
        marginTop: 2,
      }}
    />
  </button>
);

// ─── Zone 4: Order Row ─────────────────────────────────────────────────────────

const OrderRow: React.FC<{ order: Order; index: number; onClick: () => void }> = ({
  order,
  index,
  onClick,
}) => {
  const initials = getOrderInitials(order);
  const s = getStatusInfo(order.orderStatus as string);
  return (
    <button
      type="button"
      onClick={onClick}
      className="order-row flex w-full items-center gap-3 px-5 py-3.5 transition-colors hover:bg-black/[0.02] active:bg-black/[0.04]"
      style={{ '--i': index } as React.CSSProperties}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[12px] font-black"
        style={{ background: s.bg, color: s.dot }}
      >
        {initials}
      </div>

      <div className="flex-1 min-w-0 text-left">
        <p className="truncate text-[13px] font-bold text-[var(--admin-pro-text)]">
          {order.customerName?.trim() || `#${order.orderNumber ?? order.id.slice(-4)}`}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span
            style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }}
          />
          <span className="text-[11px] font-semibold" style={{ color: s.dot }}>
            {s.label}
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-[13px] font-black tabular-nums text-[var(--admin-pro-text)]">
          {formatMoney(order.total)}
          <span className="ml-0.5 text-[10px] font-medium text-[var(--admin-pro-text-muted)]">
            so'm
          </span>
        </p>
        <p className="mt-0.5 text-[10px] font-medium text-[var(--admin-pro-text-muted)]">
          {timeAgo(order.createdAt)}
        </p>
      </div>
    </button>
  );
};

// ─── Zone 5: Quick Action ──────────────────────────────────────────────────────

interface QuickActionProps {
  label: string;
  icon: React.ReactNode;
  color: string;
  index: number;
  onClick: () => void;
  badge?: number;
}

const QuickAction: React.FC<QuickActionProps> = ({
  label, icon, color, index, onClick, badge,
}) => (
  <div className="relative quick-action" style={{ '--i': index } as React.CSSProperties}>
    {badge ? (
      <span className="absolute -right-1.5 -top-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--admin-danger)] px-1.5 text-[10px] font-black text-white shadow">
        {badge > 99 ? '99+' : badge}
      </span>
    ) : null}
    <button
      type="button"
      onClick={onClick}
      className="admin-pro-card flex w-full flex-col items-center justify-center gap-2 rounded-[20px] px-3 py-5 active:scale-[0.95] transition-transform"
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ background: `${color}14`, color }}
      >
        {icon}
      </span>
      <span className="text-[12px] font-bold text-center text-[var(--admin-pro-text)] leading-tight">
        {label}
      </span>
    </button>
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const clock = useLiveClock();
  const todayLabel = useMemo(() => getTodayLabel(), []);

  const storeOrders = useOrdersStore((s) => s.orders);
  const { data: adminOrders = [], isLoading } = useAdminOrders();
  const { data: couriers = [] } = useAdminCourierDirectory();

  const orders = adminOrders.length > 0 ? adminOrders : storeOrders;

  // Derived stats
  const pendingOrders = orders.filter(
    (o) =>
      o.orderStatus === OrderStatusEnum.PENDING ||
      o.paymentStatus === PaymentStatusEnum.PENDING,
  );
  const deliveredOrders = orders.filter(
    (o) => o.orderStatus === OrderStatusEnum.DELIVERED,
  );
  const activeOrders = orders.filter(
    (o) =>
      o.orderStatus !== OrderStatusEnum.PENDING &&
      o.orderStatus !== OrderStatusEnum.DELIVERED,
  );
  const onlineCouriers = couriers.filter((c) => c.isOnline).length;
  const deliveredRevenue = deliveredOrders.reduce((s, o) => s + o.total, 0);
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const revenue = deliveredRevenue || totalRevenue;

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5),
    [orders],
  );

  const isInitialLoading =
    isLoading && adminOrders.length === 0 && storeOrders.length === 0;

  if (isInitialLoading) return <Skeleton />;

  const isUrgent = pendingOrders.length > 0;

  return (
    <div className="space-y-3 pb-[calc(env(safe-area-inset-bottom,0px)+104px)]">

      {/* ── ZONE 1: Urgent Alert ──────────────────────────────────────────────── */}
      {isUrgent && (
        <AlertBanner
          count={pendingOrders.length}
          onClick={() => navigate('/admin/orders')}
        />
      )}

      {/* ── ZONE 2: Revenue Hero (always visible) ─────────────────────────────── */}
      <section className="zone-hero admin-hero-card rounded-[28px] p-6 shadow-xl">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl text-[18px]"
              style={{ background: 'rgba(0,0,0,0.1)' }}
              aria-hidden
            >
              🍜
            </span>
            <span className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[rgba(28,16,0,0.65)]">
              Turon Kafe
            </span>
          </div>
          <div className="admin-hero-clock">
            <Clock size={11} />
            {clock}
          </div>
        </div>

        {/* Revenue block */}
        <div className="mt-5 pt-5 border-t border-[rgba(0,0,0,0.1)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[rgba(28,16,0,0.5)]">
            Bugungi daromad
          </p>
          <div className="mt-2 flex items-end justify-between gap-2">
            <div>
              <p
                className="font-black text-[#18100A] leading-none tracking-tight"
                style={{ fontSize: 48 }}
              >
                {formatMoney(revenue)}
                <span className="ml-2 text-[20px] font-bold text-[rgba(28,16,0,0.45)]">
                  so'm
                </span>
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <TrendingUp size={13} className="text-[rgba(28,16,0,0.5)]" />
                <span className="text-[12px] font-bold text-[rgba(28,16,0,0.55)]">
                  {deliveredOrders.length} ta yetkazildi
                </span>
              </div>
            </div>
            <div
              className="shrink-0 rounded-2xl px-4 py-2.5 text-center"
              style={{ background: 'rgba(0,0,0,0.1)' }}
            >
              <p className="text-[28px] font-black text-[#18100A] leading-none tabular-nums">
                {orders.length}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-[rgba(28,16,0,0.5)] mt-1">
                {todayLabel.split(',')[0]}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ZONE 3: Stats ─────────────────────────────────────────────────────── */}
      <section className="space-y-2.5">

        {/* 3a — Pending (full-width, 2× visual weight when urgent) */}
        {isUrgent && (
          <PendingHero
            count={pendingOrders.length}
            onClick={() => navigate('/admin/orders')}
          />
        )}

        {/* 3b — Secondary stats (3-column) */}
        <div className="grid grid-cols-3 gap-2.5">
          <StatCard
            label="Yetkazildi"
            value={deliveredOrders.length}
            dot="#276749"
            index={1}
            onClick={() => navigate('/admin/orders')}
          />
          <StatCard
            label="Faol"
            value={activeOrders.length}
            dot="#2B6CB0"
            index={2}
            onClick={() => navigate('/admin/orders')}
          />
          <StatCard
            label="Kuryerlar"
            value={onlineCouriers}
            dot="#D4891A"
            index={3}
            onClick={() => navigate('/admin/couriers')}
          />
        </div>
      </section>

      {/* ── ZONE 4: Live Order Feed ───────────────────────────────────────────── */}
      <section className="admin-pro-card overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--admin-pro-text-muted)]">
              Tezkor ko'rish
            </p>
            <p className="text-[15px] font-black text-[var(--admin-pro-text)]">
              Oxirgi buyurtmalar
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/orders')}
            className="flex items-center gap-1 text-[var(--admin-pro-primary-strong)] text-[12px] font-bold active:opacity-70 transition-opacity"
          >
            Barchasi
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="divide-y divide-[var(--admin-pro-line)]">
          {recentOrders.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <ShoppingBag
                size={28}
                className="mx-auto mb-3 text-[var(--admin-pro-text-muted)] opacity-40"
              />
              <p className="text-[13px] font-semibold text-[var(--admin-pro-text-muted)]">
                Hali buyurtma yo'q
              </p>
            </div>
          ) : (
            recentOrders.map((order, i) => (
              <OrderRow
                key={order.id}
                order={order}
                index={i}
                onClick={() => navigate(`/admin/orders/${order.id}`)}
              />
            ))
          )}
        </div>
      </section>

      {/* ── ZONE 5: Quick Actions (4 items, 2×2) ─────────────────────────────── */}
      <section className="admin-pro-card p-4">
        <p className="mb-3 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--admin-pro-text-muted)]">
          Tezkor o'tish
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <QuickAction
            label="Buyurtmalar"
            icon={<ShoppingBag size={20} />}
            color="#C53030"
            index={0}
            onClick={() => navigate('/admin/orders')}
            badge={pendingOrders.length || undefined}
          />
          <QuickAction
            label="Kuryerlar"
            icon={<Bike size={20} />}
            color="#2B6CB0"
            index={1}
            onClick={() => navigate('/admin/couriers')}
          />
          <QuickAction
            label="Menyu"
            icon={<UtensilsCrossed size={20} />}
            color="#D4891A"
            index={2}
            onClick={() => navigate('/admin/menu')}
          />
          <QuickAction
            label="Hisobot"
            icon={<BarChart3 size={20} />}
            color="#276749"
            index={3}
            onClick={() => navigate('/admin/reports')}
          />
        </div>
      </section>

      <p className="pb-2 text-center text-[11px] font-semibold text-[var(--admin-pro-text-muted)] opacity-40 select-none">
        Turon Kafe · Admin Panel
      </p>

    </div>
  );
};

export default AdminDashboardPage;
