import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Clock3,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Tag,
  Truck,
  UserRound,
  XCircle,
} from 'lucide-react';
import { useAdminOrders, useUpdateOrderStatus } from '../../hooks/queries/useOrders';
import { useOrdersStore } from '../../store/useOrdersStore';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../../data/types';
import { getNextStatus, getStatusLabel } from '../../lib/orderStatusUtils';

type LaneFilter = 'ALL' | OrderStatus;

interface LaneDefinition {
  status: OrderStatus;
  title: string;
  subtitle: string;
  dotClass: string;
  surfaceClass: string;
  borderClass: string;
  pillClass: string;
  emptyMessage: string;
}

const BOARD_LANES: LaneDefinition[] = [
  {
    status: OrderStatus.PENDING,
    title: 'Yangi',
    subtitle: 'Tasdiq kutayotgan buyurtmalar',
    dotClass: 'bg-amber-500',
    surfaceClass: 'bg-amber-50',
    borderClass: 'border-amber-100',
    pillClass: 'bg-amber-100 text-amber-700',
    emptyMessage: 'Yangi buyurtmalar yo\'q',
  },
  {
    status: OrderStatus.PREPARING,
    title: 'Tayyorlanmoqda',
    subtitle: 'Oshxona ish jarayonida',
    dotClass: 'bg-blue-500',
    surfaceClass: 'bg-blue-50',
    borderClass: 'border-blue-100',
    pillClass: 'bg-blue-100 text-blue-700',
    emptyMessage: 'Tayyorlanayotgan buyurtmalar yo\'q',
  },
  {
    status: OrderStatus.READY_FOR_PICKUP,
    title: 'Tayyor',
    subtitle: 'Kuryerga topshirish navbati',
    dotClass: 'bg-emerald-500',
    surfaceClass: 'bg-emerald-50',
    borderClass: 'border-emerald-100',
    pillClass: 'bg-emerald-100 text-emerald-700',
    emptyMessage: 'Pickup uchun tayyor buyurtmalar yo\'q',
  },
  {
    status: OrderStatus.DELIVERING,
    title: 'Yo\'lda',
    subtitle: 'Kuryer mijozga olib bormoqda',
    dotClass: 'bg-violet-500',
    surfaceClass: 'bg-violet-50',
    borderClass: 'border-violet-100',
    pillClass: 'bg-violet-100 text-violet-700',
    emptyMessage: 'Yo\'ldagi buyurtmalar yo\'q',
  },
  {
    status: OrderStatus.DELIVERED,
    title: 'Yetkazildi',
    subtitle: 'Muvaffaqiyatli yakunlangan buyurtmalar',
    dotClass: 'bg-slate-900',
    surfaceClass: 'bg-slate-100',
    borderClass: 'border-slate-200',
    pillClass: 'bg-slate-900 text-white',
    emptyMessage: 'Yakunlangan buyurtmalar hali yo\'q',
  },
  {
    status: OrderStatus.CANCELLED,
    title: 'Bekor qilindi',
    subtitle: 'Muammo yoki rad etilgan buyurtmalar',
    dotClass: 'bg-rose-500',
    surfaceClass: 'bg-rose-50',
    borderClass: 'border-rose-100',
    pillClass: 'bg-rose-100 text-rose-700',
    emptyMessage: 'Bekor qilingan buyurtmalar yo\'q',
  },
];

const NEXT_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  [OrderStatus.PENDING]: 'Qabul qilish',
  [OrderStatus.PREPARING]: 'Tayyor deb belgilash',
  [OrderStatus.READY_FOR_PICKUP]: 'Yo\'lga chiqarish',
  [OrderStatus.DELIVERING]: 'Yetkazildi',
};

function formatClock(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getMinutesSince(timestamp: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000));
}

function getPaymentMeta(order: Order) {
  if (order.paymentStatus === PaymentStatus.COMPLETED) {
    return {
      label: 'To\'lov tasdiqlangan',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    };
  }

  if (order.paymentStatus === PaymentStatus.FAILED || order.paymentStatus === PaymentStatus.CANCELLED) {
    return {
      label: 'To\'lov muammoli',
      className: 'bg-rose-50 text-rose-700 border-rose-100',
    };
  }

  if (order.paymentMethod === PaymentMethod.CASH) {
    return {
      label: 'Naqd to\'lov',
      className: 'bg-slate-50 text-slate-700 border-slate-200',
    };
  }

  return {
    label: 'Online tekshiruv kutilmoqda',
    className: 'bg-amber-50 text-amber-700 border-amber-100',
  };
}

function matchesSearch(order: Order, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const searchableValues = [
    order.orderNumber?.toString(),
    order.customerName,
    order.customerPhone,
    order.courierName,
    order.customerAddress?.addressText,
    order.customerAddress?.label,
    order.note,
    order.promoCode,
  ];

  return searchableValues.some((value) => value?.toLowerCase().includes(normalizedQuery));
}

const BoardSkeleton: React.FC = () => (
  <div className="space-y-5 animate-pulse">
    <div className="h-32 rounded-[30px] bg-slate-200" />
    <div className="h-14 rounded-[22px] bg-slate-200" />
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="min-w-[290px] w-[290px] space-y-3">
          <div className="h-28 rounded-[28px] bg-slate-200" />
          <div className="h-44 rounded-[28px] bg-slate-200" />
          <div className="h-44 rounded-[28px] bg-slate-200" />
        </div>
      ))}
    </div>
  </div>
);

interface SummaryStatProps {
  label: string;
  value: string;
  hint: string;
}

const SummaryStat: React.FC<SummaryStatProps> = ({ label, value, hint }) => (
  <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-4">
    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{label}</p>
    <p className="text-3xl font-black tracking-tight text-slate-900 mt-3 leading-none">{value}</p>
    <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed">{hint}</p>
  </div>
);

interface BoardOrderCardProps {
  order: Order;
  onOpen: () => void;
  onAdvance: (order: Order) => void;
  onCancel: (order: Order) => void;
  isMutating: boolean;
}

const BoardOrderCard: React.FC<BoardOrderCardProps> = ({
  order,
  onOpen,
  onAdvance,
  onCancel,
  isMutating,
}) => {
  const nextStatus = getNextStatus(order.orderStatus);
  const paymentMeta = getPaymentMeta(order);
  const minutesSinceCreated = getMinutesSince(order.createdAt);
  const isFinal = order.orderStatus === OrderStatus.DELIVERED || order.orderStatus === OrderStatus.CANCELLED;

  return (
    <article className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onOpen}
            className="text-left"
          >
            <p className="text-lg font-black tracking-tight text-slate-900">#{order.orderNumber}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
              {formatClock(order.createdAt)} | {minutesSinceCreated} min oldin
            </p>
          </button>
        </div>

        <div className="text-right">
          <p className="text-lg font-black tracking-tight text-slate-900">
            {order.total.toLocaleString()}
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">so&apos;m</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <UserRound size={16} className="text-slate-400" />
          <span>{order.customerName || 'Mijoz'}</span>
        </div>
        <div className="flex items-start gap-2 text-xs font-bold text-slate-500">
          <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{order.customerAddress?.addressText || 'Manzil ko\'rsatilmagan'}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="px-2.5 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600">
          {order.items.length} ta item
        </span>
        <span className={`px-2.5 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${paymentMeta.className}`}>
          {paymentMeta.label}
        </span>
        <span className="px-2.5 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600">
          {order.courierName ? `Kuryer: ${order.courierName}` : 'Kuryer biriktirilmagan'}
        </span>
        {order.promoCode ? (
          <span className="px-2.5 py-1.5 rounded-full border border-indigo-100 bg-indigo-50 text-[10px] font-black uppercase tracking-widest text-indigo-700">
            Promo: {order.promoCode}
          </span>
        ) : null}
      </div>

      {order.note ? (
        <div className="rounded-2xl bg-amber-50 border border-amber-100 px-3 py-2 flex items-start gap-2">
          <Tag size={14} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs font-bold text-amber-700 line-clamp-2">{order.note}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="h-11 rounded-2xl border border-slate-200 bg-white text-slate-700 text-[11px] font-black uppercase tracking-widest"
        >
          Batafsil
        </button>

        {nextStatus ? (
          <button
            type="button"
            onClick={() => onAdvance(order)}
            disabled={isMutating}
            className="h-11 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isMutating ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            <span>{NEXT_ACTION_LABELS[order.orderStatus]}</span>
          </button>
        ) : (
          <div className={`h-11 rounded-2xl flex items-center justify-center text-[11px] font-black uppercase tracking-widest ${
            isFinal ? 'bg-slate-100 text-slate-500' : 'bg-slate-50 text-slate-400'
          }`}>
            {isFinal ? 'Yakunlangan' : getStatusLabel(order.orderStatus)}
          </div>
        )}
      </div>

      {!isFinal ? (
        <button
          type="button"
          onClick={() => onCancel(order)}
          disabled={isMutating}
          className="w-full h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isMutating ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
          <span>Bekor qilish</span>
        </button>
      ) : null}
    </article>
  );
};

const AdminOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLane, setActiveLane] = useState<LaneFilter>('ALL');
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutatingOrderId, setMutatingOrderId] = useState<string | null>(null);

  const storeOrders = useOrdersStore((state) => state.orders);
  const {
    data: adminOrders = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useAdminOrders();
  const updateOrderStatus = useUpdateOrderStatus();

  const useFallbackOrders = (isLoading || isError) && storeOrders.length > 0;
  const orders = useFallbackOrders ? storeOrders : adminOrders;

  const filteredOrders = useMemo(
    () => orders.filter((order) => matchesSearch(order, searchQuery)),
    [orders, searchQuery],
  );

  const visibleLanes = useMemo(
    () => (activeLane === 'ALL' ? BOARD_LANES : BOARD_LANES.filter((lane) => lane.status === activeLane)),
    [activeLane],
  );

  const laneCounts = useMemo(() => {
    const counts = new Map<OrderStatus, number>();

    for (const lane of BOARD_LANES) {
      counts.set(
        lane.status,
        filteredOrders.filter((order) => order.orderStatus === lane.status).length,
      );
    }

    return counts;
  }, [filteredOrders]);

  const boardData = useMemo(
    () =>
      visibleLanes.map((lane) => {
        const laneOrders = filteredOrders.filter((order) => order.orderStatus === lane.status);
        const laneTotal = laneOrders.reduce((sum, order) => sum + order.total, 0);

        return {
          lane,
          laneOrders,
          laneTotal,
        };
      }),
    [filteredOrders, visibleLanes],
  );

  const pendingOrdersCount = useMemo(
    () => orders.filter((order) => order.orderStatus === OrderStatus.PENDING).length,
    [orders],
  );

  const activeOrdersCount = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.orderStatus !== OrderStatus.DELIVERED && order.orderStatus !== OrderStatus.CANCELLED,
      ).length,
    [orders],
  );

  const pendingPaymentCount = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.paymentStatus === PaymentStatus.PENDING && order.paymentMethod !== PaymentMethod.CASH,
      ).length,
    [orders],
  );

  const readyForPickupCount = useMemo(
    () => orders.filter((order) => order.orderStatus === OrderStatus.READY_FOR_PICKUP).length,
    [orders],
  );

  const activeCourierCount = useMemo(() => {
    const courierIds = orders
      .filter(
        (order) =>
          order.courierId &&
          order.orderStatus !== OrderStatus.DELIVERED &&
          order.orderStatus !== OrderStatus.CANCELLED,
      )
      .map((order) => order.courierId as string);

    return new Set(courierIds).size;
  }, [orders]);

  const handleStatusUpdate = async (order: Order, nextStatus: OrderStatus) => {
    setMutationError(null);
    setMutatingOrderId(order.id);

    try {
      await updateOrderStatus.mutateAsync({ id: order.id, status: nextStatus });

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    } catch (mutationFailure) {
      const message = mutationFailure instanceof Error ? mutationFailure.message : 'Status yangilanmadi';
      setMutationError(message);

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setMutatingOrderId(null);
    }
  };

  const handleAdvanceOrder = (order: Order) => {
    const nextStatus = getNextStatus(order.orderStatus);

    if (!nextStatus) {
      return;
    }

    if (nextStatus === OrderStatus.DELIVERING && !order.courierId) {
      setMutationError('Buyurtmani yo\'lga chiqarishdan oldin kuryer biriktiring');

      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }

      return;
    }

    void handleStatusUpdate(order, nextStatus);
  };

  const handleCancelOrder = (order: Order) => {
    const shouldCancel = window.confirm(`Buyurtma #${order.orderNumber} ni bekor qilamizmi?`);

    if (!shouldCancel) {
      return;
    }

    void handleStatusUpdate(order, OrderStatus.CANCELLED);
  };

  if (isLoading && storeOrders.length === 0) {
    return <BoardSkeleton />;
  }

  if (isError && !useFallbackOrders) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <AlertCircle size={48} className="text-red-500" />
        <h3 className="font-bold text-slate-900 uppercase">Xatolik yuz berdi</h3>
        <p className="text-sm text-slate-500">{(error as Error).message}</p>
        <button
          onClick={() => refetch()}
          className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold"
        >
          Yangilash
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <section className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white shadow-2xl shadow-slate-300/40 overflow-hidden relative">
        <div className="absolute -top-20 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -left-12 w-36 h-36 rounded-full bg-blue-400/20 blur-2xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="max-w-[78%]">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-300">
              Order Management Board
            </p>
            <h2 className="text-3xl font-black tracking-tight leading-none mt-3">
              Buyurtmalar oqimini jonli boshqarish
            </h2>
            <p className="text-sm font-bold text-slate-300 mt-3 leading-relaxed">
              Har bir status alohida yo&apos;lakda. Admin shu ekranning o&apos;zida buyurtmani keyingi bosqichga o&apos;tkazadi yoki bekor qiladi.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform"
            aria-label="Buyurtmalarni yangilash"
          >
            {isFetching ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
          </button>
        </div>

        <div className="relative grid grid-cols-2 gap-3 mt-6">
          <div className="rounded-[24px] bg-white/10 border border-white/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-300">
              Faol buyurtmalar
            </p>
            <p className="text-4xl font-black leading-none mt-3">{activeOrdersCount}</p>
            <p className="text-xs font-bold text-slate-300 mt-2">
              {pendingOrdersCount} ta yangi | {readyForPickupCount} ta pickup tayyor
            </p>
          </div>
          <div className="rounded-[24px] bg-blue-400/15 border border-blue-300/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-100">
              Operatsion signal
            </p>
            <p className="text-3xl font-black leading-none mt-3">{pendingPaymentCount}</p>
            <p className="text-xs font-bold text-blue-100/80 mt-2">
              online tekshiruv kutmoqda | {activeCourierCount} ta faol kuryer
            </p>
          </div>
        </div>
      </section>

      {isError && useFallbackOrders ? (
        <div className="bg-amber-50 border border-amber-200 rounded-[24px] p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-sm font-black text-amber-900">API ulanmagan, lokal snapshot ishlayapti</p>
            <p className="text-xs font-bold text-amber-700 mt-1 leading-relaxed">
              Board vaqtincha saqlangan buyurtmalar bilan ko&apos;rsatilmoqda. Aloqa tiklangach jonli ma&apos;lumot qaytadi.
            </p>
          </div>
        </div>
      ) : null}

      {mutationError ? (
        <div className="bg-rose-50 border border-rose-100 rounded-[24px] p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-sm font-black text-rose-900">Status yangilanmadi</p>
            <p className="text-xs font-bold text-rose-700 mt-1 leading-relaxed">{mutationError}</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <SummaryStat
          label="Qidiruv natijasi"
          value={filteredOrders.length.toString()}
          hint="Joriy filter va qidiruv bo'yicha buyurtmalar"
        />
        <SummaryStat
          label="Yangi buyurtmalar"
          value={laneCounts.get(OrderStatus.PENDING)?.toString() || '0'}
          hint="Darhol admin tasdig'ini kutayotganlar"
        />
      </div>

      <section className="space-y-3">
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-4">
          <label className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
              <Search size={20} />
            </div>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buyurtma raqami, mijoz, telefon yoki manzil bo'yicha qidiring"
              className="w-full bg-transparent outline-none text-sm font-bold text-slate-900 placeholder:text-slate-400"
            />
          </label>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
          <button
            type="button"
            onClick={() => setActiveLane('ALL')}
            className={`whitespace-nowrap px-5 h-11 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${
              activeLane === 'ALL'
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                : 'bg-white text-slate-500 border border-slate-100'
            }`}
          >
            <span>Barcha yo'laklar</span>
            <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold ${
              activeLane === 'ALL' ? 'bg-white/15' : 'bg-slate-50'
            }`}>
              {filteredOrders.length}
            </span>
          </button>

          {BOARD_LANES.map((lane) => (
            <button
              key={lane.status}
              type="button"
              onClick={() => setActiveLane(lane.status)}
              className={`whitespace-nowrap px-5 h-11 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${
                activeLane === lane.status
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                  : 'bg-white text-slate-500 border border-slate-100'
              }`}
            >
              <span>{lane.title}</span>
              <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                activeLane === lane.status ? 'bg-white/15' : 'bg-slate-50'
              }`}>
                {laneCounts.get(lane.status) || 0}
              </span>
            </button>
          ))}
        </div>
      </section>

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
            <ShoppingBag size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Hech narsa topilmadi</h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
            Qidiruvni o'zgartiring yoki boshqa yo'lakni tanlang
          </p>
        </div>
      ) : (
        <section className="space-y-3">
          <div className="px-1 flex items-center justify-between">
            <div>
              <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-400">
                Buyurtma yo'laklari
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-1">
                Chapdan o&apos;ngga oqim: yangi buyurtmadan yakunlangan statusgacha
              </p>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 snap-x snap-mandatory">
            {boardData.map(({ lane, laneOrders, laneTotal }) => (
              <section
                key={lane.status}
                className={`min-w-[290px] w-[290px] rounded-[30px] border ${lane.borderClass} ${lane.surfaceClass} p-4 space-y-4 snap-start`}
              >
                <div className="rounded-[24px] bg-white/80 border border-white/70 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${lane.dotClass}`} />
                        <h4 className="text-base font-black text-slate-900 tracking-tight">{lane.title}</h4>
                      </div>
                      <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed">
                        {lane.subtitle}
                      </p>
                    </div>

                    <span className={`px-2.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${lane.pillClass}`}>
                      {laneOrders.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jami summa</p>
                      <p className="text-sm font-black text-slate-900 mt-2">{laneTotal.toLocaleString()} so&apos;m</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Signal</p>
                      <p className="text-sm font-black text-slate-900 mt-2">
                        {lane.status === OrderStatus.DELIVERING
                          ? 'Kuryer nazorati'
                          : lane.status === OrderStatus.READY_FOR_PICKUP
                            ? 'Pickup navbati'
                            : lane.status === OrderStatus.CANCELLED
                              ? 'Muammo'
                              : 'Nazorat'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {laneOrders.length > 0 ? (
                    laneOrders.map((order) => (
                      <BoardOrderCard
                        key={order.id}
                        order={order}
                        onOpen={() => navigate(`/admin/orders/${order.id}`)}
                        onAdvance={handleAdvanceOrder}
                        onCancel={handleCancelOrder}
                        isMutating={mutatingOrderId === order.id}
                      />
                    ))
                  ) : (
                    <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/70 p-5 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        {lane.status === OrderStatus.DELIVERING ? (
                          <Truck size={20} />
                        ) : lane.status === OrderStatus.READY_FOR_PICKUP ? (
                          <Package size={20} />
                        ) : (
                          <Clock3 size={20} />
                        )}
                      </div>
                      <p className="text-sm font-black text-slate-900 mt-4">{lane.emptyMessage}</p>
                      <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed">
                        Ushbu statusdagi buyurtmalar paydo bo&apos;lganda shu yo&apos;lakda ko&apos;rinadi.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminOrdersPage;
