import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bell,
  Bike,
  ClipboardList,
  Clock,
  MessageCircle,
  Store,
  Tag,
  TrendingUp,
  UtensilsCrossed,
  Zap,
} from 'lucide-react';
import { OrderStatusEnum, PaymentStatusEnum } from '@turon/shared';
import { useAdminOrders } from '../../hooks/queries/useOrders';
import { useAdminCourierDirectory } from '../../hooks/queries/useCouriers';
import { useOrdersStore } from '../../store/useOrdersStore';
import { useAdminUnreadTotal } from '../../hooks/queries/useAdminChats';

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatCompactMoney(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return value.toString();
}

const UZ_DAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
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
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${padTwo(d.getHours())}:${padTwo(d.getMinutes())}`;
  });
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(`${padTwo(d.getHours())}:${padTwo(d.getMinutes())}`);
    };
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const DashboardLoadingState: React.FC = () => (
  <div className="space-y-4 pb-[calc(env(safe-area-inset-bottom,0px)+96px)]">
    <div className="admin-pro-card admin-hero-card p-6">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-24 rounded-full bg-white/20" />
          <div className="h-6 w-16 rounded-full bg-white/15" />
        </div>
        <div className="h-3 w-20 rounded-full bg-white/20 mb-2" />
        <div className="h-6 w-44 rounded-2xl bg-white/25 mb-1.5" />
        <div className="h-3 w-32 rounded-full bg-white/15" />
        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/10">
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-20 rounded-full bg-white/15" />
            <div className="h-7 w-10 rounded-xl bg-white/20" />
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="flex-1 space-y-2 flex flex-col items-end">
            <div className="h-2.5 w-16 rounded-full bg-white/15" />
            <div className="h-7 w-14 rounded-xl bg-white/20" />
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="admin-pro-card p-4">
          <div className="animate-pulse space-y-3">
            <div className="flex items-start justify-between">
              <div className="h-2.5 w-20 rounded-full bg-slate-200" />
              <div className="h-9 w-9 rounded-xl bg-slate-100" />
            </div>
            <div className="h-8 w-14 rounded-xl bg-slate-200" />
            <div className="h-2.5 w-24 rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>

    <div className="admin-pro-card p-5">
      <div className="animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <div className="h-2.5 w-24 rounded-full bg-slate-200" />
            <div className="h-5 w-44 rounded-xl bg-slate-200" />
          </div>
          <div className="h-7 w-20 rounded-full bg-slate-100" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[88px] rounded-[20px] bg-slate-50" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── Alert Banner ──────────────────────────────────────────────────────────────

const AlertBanner: React.FC<{ count: number; onClick: () => void }> = ({ count, onClick }) => (
  <button type="button" onClick={onClick} className="admin-alert-banner w-full">
    <span className="admin-alert-dot" />
    <span className="flex-1 text-left">
      <strong>{count} ta buyurtma</strong> tasdiq kutmoqda
    </span>
    <ArrowRight size={15} className="shrink-0 opacity-60" />
  </button>
);

// ─── Stat Card ─────────────────────────────────────────────────────────────────

type StatTone = 'neutral' | 'success' | 'warning' | 'danger';

const StatCard: React.FC<{
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  tone?: StatTone;
  delay?: number;
}> = ({ title, value, hint, icon, tone = 'neutral', delay = 0 }) => {
  const iconClass =
    tone === 'success' ? 'bg-emerald-50 text-emerald-600' :
    tone === 'warning' ? 'bg-[rgba(255,212,59,0.22)] text-[#7a5600]' :
    tone === 'danger'  ? 'bg-rose-50 text-rose-500' :
                         'bg-[rgba(255,212,59,0.18)] text-[#7a5600]';

  const valueClass =
    tone === 'success' ? 'text-emerald-700' :
    tone === 'warning' ? 'text-[#5a3b00]' :
    tone === 'danger'  ? 'text-rose-600' :
                          'text-[var(--admin-pro-text)]';

  const toneClass =
    tone === 'success' ? 'admin-stat-success' :
    tone === 'warning' ? 'admin-stat-warning' :
    tone === 'danger'  ? 'admin-stat-danger' : '';

  return (
    <div
      className={`admin-pro-card ${toneClass} admin-motion-stagger p-4`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--admin-pro-text-muted)] leading-tight pr-1">
          {title}
        </p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          {icon}
        </span>
      </div>
      <p className={`text-[32px] font-black leading-none tracking-tight ${valueClass}`}>{value}</p>
      <p className="mt-2 text-[11px] font-semibold text-[var(--admin-pro-text-muted)] leading-snug">{hint}</p>
    </div>
  );
};

// ─── Quick Action Card ─────────────────────────────────────────────────────────

const QuickActionCard: React.FC<{
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  badge?: number;
  urgent?: boolean;
  delay?: number;
}> = ({ label, icon, onClick, badge, urgent = false, delay = 0 }) => (
  <div
    className="relative admin-motion-stagger"
    style={{ animationDelay: `${delay}ms` }}
  >
    {badge ? (
      <span className="absolute -right-1.5 -top-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white shadow">
        {badge > 99 ? '99+' : badge}
      </span>
    ) : null}
    <button
      type="button"
      onClick={onClick}
      className={`admin-pro-card ${urgent ? 'admin-quick-action-urgent' : ''} flex w-full flex-col items-center justify-center gap-2 rounded-[20px] px-3 py-5 text-[var(--admin-pro-text)] active:scale-[0.97] transition-transform cursor-pointer`}
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${
        urgent
          ? 'bg-[var(--admin-pro-primary)] text-[var(--admin-pro-primary-contrast)] shadow-[0_8px_20px_rgba(255,190,11,0.3)]'
          : 'bg-[rgba(255,212,59,0.18)] text-[#7a5600] border border-[rgba(255,190,11,0.16)]'
      }`}>
        {icon}
      </span>
      <span className="text-[12px] font-bold leading-tight text-center">{label}</span>
    </button>
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const currentTime = useLiveClock();
  const todayLabel = useMemo(() => getTodayLabel(), []);

  const storeOrders = useOrdersStore((state) => state.orders);
  const { data: chatUnread = 0 } = useAdminUnreadTotal();
  const { data: adminOrders = [], isLoading } = useAdminOrders();
  const { data: couriers = [] } = useAdminCourierDirectory();

  const orders = adminOrders.length > 0 ? adminOrders : storeOrders;
  const newOrders = orders.filter((o) => o.orderStatus === OrderStatusEnum.PENDING);
  const pendingOrders = orders.filter(
    (o) =>
      o.orderStatus === OrderStatusEnum.PENDING ||
      o.paymentStatus === PaymentStatusEnum.PENDING,
  );
  const deliveredOrders = orders.filter((o) => o.orderStatus === OrderStatusEnum.DELIVERED);
  const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const onlineCouriers = couriers.filter((c) => c.isOnline).length;
  const busyCouriers = couriers.filter((c) => c.activeAssignments > 0).length;
  const isInitialLoading = isLoading && adminOrders.length === 0 && storeOrders.length === 0;

  const quickActions = useMemo(
    () => [
      {
        key: 'orders',
        label: 'Buyurtmalar',
        icon: <ClipboardList size={20} />,
        onClick: () => navigate('/admin/orders'),
        badge: newOrders.length || undefined,
        urgent: newOrders.length > 0,
      },
      {
        key: 'couriers',
        label: 'Kuryerlar',
        icon: <Bike size={20} />,
        onClick: () => navigate('/admin/couriers'),
        badge: busyCouriers || undefined,
        urgent: false,
      },
      {
        key: 'menu',
        label: 'Menyu',
        icon: <UtensilsCrossed size={20} />,
        onClick: () => navigate('/admin/menu'),
        urgent: false,
      },
      {
        key: 'promos',
        label: 'Promokodlar',
        icon: <Tag size={20} />,
        onClick: () => navigate('/admin/promos'),
        urgent: false,
      },
      {
        key: 'reports',
        label: 'Hisobotlar',
        icon: <BarChart3 size={20} />,
        onClick: () => navigate('/admin/reports'),
        urgent: false,
      },
      {
        key: 'notifications',
        label: 'Xabarlar',
        icon: <Bell size={20} />,
        onClick: () => navigate('/admin/notifications'),
        badge: pendingOrders.length || undefined,
        urgent: false,
      },
      {
        key: 'chats',
        label: 'Chat',
        icon: <MessageCircle size={20} />,
        onClick: () => navigate('/admin/chats'),
        badge: chatUnread || undefined,
        urgent: false,
      },
      {
        key: 'restaurant',
        label: 'Restoran',
        icon: <Store size={20} />,
        onClick: () => navigate('/admin/restaurant'),
        urgent: false,
      },
    ],
    [navigate, newOrders.length, busyCouriers, pendingOrders.length, chatUnread],
  );

  if (isInitialLoading) return <DashboardLoadingState />;

  return (
    <div className="space-y-4 pb-[calc(env(safe-area-inset-bottom,0px)+96px)]">

      {/* ── Hero Card ─────────────────────────────────────────────────────────── */}
      <section className="admin-pro-card admin-hero-card admin-motion-up p-6">
        {/* Top row: branding + clock */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none select-none">🍜</span>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/65">
              Turon Kafe
            </span>
          </div>
          <div className="admin-hero-clock">
            <Clock size={11} />
            {currentTime}
          </div>
        </div>

        {/* Status + headline */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="admin-status-dot active" />
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">
            Umumiy holat
          </p>
        </div>
        <h2 className="text-[20px] font-black tracking-tight text-white leading-snug">
          {"Bugungi ko'rsatkichlar"}
        </h2>
        <p className="text-[13px] font-semibold text-white/55 mt-0.5">{todayLabel}</p>

        {/* Summary strip */}
        <div className="flex items-stretch gap-4 mt-5 pt-4 border-t border-white/[0.1]">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/45 mb-1">
              Jami buyurtmalar
            </p>
            <p className="text-[26px] font-black text-white leading-none">{orders.length}</p>
          </div>
          <div className="w-px bg-white/[0.12] self-stretch" />
          <div className="flex-1 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/45 mb-1">
              Daromad
            </p>
            <p className="text-[26px] font-black text-white leading-none">
              {formatCompactMoney(deliveredRevenue || totalRevenue)}
              <span className="text-[13px] font-semibold text-white/50 ml-1">so'm</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── Alert Banner (conditional) ────────────────────────────────────────── */}
      {pendingOrders.length > 0 && (
        <AlertBanner count={pendingOrders.length} onClick={() => navigate('/admin/orders')} />
      )}

      {/* ── KPI Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Yangi buyurtmalar"
          value={newOrders.length.toString()}
          hint={newOrders.length > 0 ? 'Kutilayotgan' : "Yangi yo'q"}
          icon={<ClipboardList size={16} />}
          tone="neutral"
          delay={60}
        />
        <StatCard
          title="Bugungi daromad"
          value={formatCompactMoney(deliveredRevenue || totalRevenue)}
          hint="UZS hisobida"
          icon={<TrendingUp size={16} />}
          tone="success"
          delay={100}
        />
        <StatCard
          title="Faol kuryerlar"
          value={`${onlineCouriers}/${couriers.length || 0}`}
          hint={`${busyCouriers} ta yetkazmoqda`}
          icon={<Bike size={16} />}
          tone="warning"
          delay={140}
        />
        <StatCard
          title="Kutilayotgan"
          value={pendingOrders.length.toString()}
          hint={pendingOrders.length > 0 ? 'Tasdiq kutmoqda' : 'Hammasi tartibda'}
          icon={<AlertCircle size={16} />}
          tone={pendingOrders.length > 0 ? 'danger' : 'neutral'}
          delay={180}
        />
      </div>

      {/* ── Quick Actions ──────────────────────────────────────────────────────── */}
      <section
        className="admin-pro-card p-5 admin-motion-stagger"
        style={{ animationDelay: '220ms' }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--admin-pro-text-muted)] mb-1">
              Tezkor amallar
            </p>
            <p className="text-[17px] font-black tracking-tight text-[var(--admin-pro-text)] leading-tight">
              Bitta bosishda boshqarish
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-[rgba(255,190,11,0.22)] bg-[rgba(255,212,59,0.14)] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7a5600]">
            <Zap size={10} />
            Admin
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((item, i) => (
            <QuickActionCard
              key={item.key}
              label={item.label}
              icon={item.icon}
              badge={item.badge}
              onClick={item.onClick}
              urgent={item.urgent}
              delay={220 + i * 28}
            />
          ))}
        </div>
      </section>

      <p className="pb-1 text-center text-[11px] font-semibold text-[var(--admin-pro-text-muted)] opacity-50">
        @turonkafebot · Admin Panel
      </p>

    </div>
  );
};

export default AdminDashboardPage;
