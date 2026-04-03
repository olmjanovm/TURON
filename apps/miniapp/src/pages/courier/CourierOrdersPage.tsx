import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, Map, Navigation, Package, RefreshCw, Route } from 'lucide-react';
import { CourierOrderCard } from '../../components/courier/CourierComponents';
import { useCourierOrders } from '../../hooks/queries/useOrders';

type CourierOrdersTab = 'new' | 'active' | 'completed';

const CourierOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<CourierOrdersTab>('new');
  const { data: courierOrders = [], isLoading, error, refetch, isFetching } = useCourierOrders();

  const newOrders = courierOrders.filter((order) => order.courierAssignmentStatus === 'ASSIGNED');
  const activeOrders = courierOrders.filter((order) =>
    ['ACCEPTED', 'PICKED_UP', 'DELIVERING'].includes(order.courierAssignmentStatus || ''),
  );
  const completedOrders = courierOrders.filter((order) => order.courierAssignmentStatus === 'DELIVERED');

  React.useEffect(() => {
    const activeTabHasData =
      (activeTab === 'new' && newOrders.length > 0) ||
      (activeTab === 'active' && activeOrders.length > 0) ||
      (activeTab === 'completed' && completedOrders.length > 0);

    if (activeTabHasData) {
      return;
    }

    if (newOrders.length > 0) {
      setActiveTab('new');
      return;
    }

    if (activeOrders.length > 0) {
      setActiveTab('active');
      return;
    }

    if (completedOrders.length > 0) {
      setActiveTab('completed');
      return;
    }

    setActiveTab('new');
  }, [activeOrders.length, activeTab, completedOrders.length, newOrders.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center px-6 py-24">
        <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <Loader2 size={28} className="mx-auto animate-spin text-sky-600" />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.22em] text-slate-500">
            Vazifalar yuklanmoqda
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-10">
        <div className="rounded-[32px] border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertCircle size={30} />
          </div>
          <h3 className="mt-5 text-xl font-black tracking-tight text-slate-900">Buyurtmalar yuklanmadi</h3>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
            {(error as Error).message}
          </p>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-slate-900 px-5 text-xs font-black uppercase tracking-[0.18em] text-white"
          >
            <RefreshCw size={15} />
            <span>Qayta urinish</span>
          </button>
        </div>
      </div>
    );
  }

  const currentOrders =
    activeTab === 'new'
      ? newOrders
      : activeTab === 'active'
        ? activeOrders
        : completedOrders;
  const highlightedActiveOrder = activeOrders[0] || null;

  const tabMeta: Array<{ key: CourierOrdersTab; label: string; count: number }> = [
    { key: 'new', label: 'Yangi', count: newOrders.length },
    { key: 'active', label: 'Faol', count: activeOrders.length },
    { key: 'completed', label: 'Tugatilgan', count: completedOrders.length },
  ];

  const emptyStateText =
    activeTab === 'new'
      ? "Yangi biriktirilgan topshiriq hozircha yo'q."
      : activeTab === 'active'
        ? "Faol yetkazib berish hozircha yo'q."
        : "Bugun tugatilgan buyurtmalar hozircha yo'q.";

  return (
    <div className="animate-in fade-in space-y-6 px-6 py-6 pb-36 duration-500">
      <section className="relative overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.3),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.22),transparent_24%),linear-gradient(135deg,#0f172a_0%,#111827_100%)] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.24)]">
        <div className="absolute -right-10 top-6 h-28 w-28 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-sky-300/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/50">
                Kuryer operatsiyasi
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">
                Buyurtmalar paneli
              </h2>
              <p className="mt-3 max-w-[270px] text-sm font-semibold leading-relaxed text-white/72">
                Yangi, faol va tugatilgan topshiriqlarni alohida boshqaring. Faol marshrutga shu yerdan tez o'ting.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                void refetch();
              }}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white backdrop-blur-md transition-transform active:scale-95"
              aria-label="Buyurtmalarni yangilash"
            >
              <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {tabMeta.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-[22px] border px-4 py-4 text-left transition-transform active:scale-[0.98] ${
                  activeTab === tab.key
                    ? 'border-white/20 bg-white/18 text-white'
                    : 'border-white/10 bg-white/10 text-white/70'
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-inherit">{tab.label}</p>
                <p className="mt-2 text-2xl font-black text-inherit">{tab.count}</p>
              </button>
            ))}
          </div>

          {highlightedActiveOrder ? (
            <button
              type="button"
              onClick={() => navigate(`/courier/map/${highlightedActiveOrder.id}`)}
              className="mt-5 flex w-full items-center justify-between rounded-[24px] border border-emerald-300/20 bg-emerald-400/14 px-5 py-4 text-left shadow-[0_18px_40px_rgba(16,185,129,0.18)] transition-transform active:scale-[0.985]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/18 text-emerald-100">
                  <Navigation size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-100/70">
                    Faol marshrut
                  </p>
                  <p className="mt-2 text-base font-black text-white">#{highlightedActiveOrder.orderNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                <span>Xaritani ochish</span>
                <Map size={16} />
              </div>
            </button>
          ) : null}
        </div>
      </section>

      {highlightedActiveOrder ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
              Hozir ishlayotgan buyurtma
            </h3>
            <button
              type="button"
              onClick={() => navigate(`/courier/order/${highlightedActiveOrder.id}`)}
              className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-900"
            >
              <span>Batafsil</span>
              <Route size={14} />
            </button>
          </div>
          <CourierOrderCard
            order={highlightedActiveOrder}
            onClick={() => navigate(`/courier/order/${highlightedActiveOrder.id}`)}
          />
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            {activeTab === 'new'
              ? 'Yangi biriktirilgan buyurtmalar'
              : activeTab === 'active'
                ? 'Faol buyurtmalar'
                : 'Tugatilgan buyurtmalar'}
          </h3>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            <Package size={14} />
            <span>{currentOrders.length} ta</span>
          </div>
        </div>

        {currentOrders.length > 0 ? (
          <div className="space-y-4">
            {currentOrders.map((order) => (
              <CourierOrderCard
                key={order.id}
                order={order}
                onClick={() => navigate(`/courier/order/${order.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-300">
              <Package size={34} />
            </div>
            <h4 className="mt-6 text-2xl font-black tracking-tight text-slate-900">Bu bo'lim bo'sh</h4>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
              {emptyStateText}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default CourierOrdersPage;
