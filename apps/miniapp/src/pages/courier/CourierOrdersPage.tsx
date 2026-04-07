import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, Map, Navigation, Package, RefreshCw } from 'lucide-react';
import { CourierOrderCard } from '../../components/courier/CourierComponents';
import { useCourierOrders } from '../../hooks/queries/useOrders';

type CourierOrdersTab = 'new' | 'active' | 'completed';

const CourierOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<CourierOrdersTab>('new');
  const { data: courierOrders = [], isLoading, error, refetch, isFetching } = useCourierOrders();

  const newOrders = courierOrders.filter((o) => o.courierAssignmentStatus === 'ASSIGNED');
  const activeOrders = courierOrders.filter((o) =>
    ['ACCEPTED', 'PICKED_UP', 'DELIVERING'].includes(o.courierAssignmentStatus || ''),
  );
  const completedOrders = courierOrders.filter((o) => o.courierAssignmentStatus === 'DELIVERED');

  React.useEffect(() => {
    const hasData =
      (activeTab === 'new' && newOrders.length > 0) ||
      (activeTab === 'active' && activeOrders.length > 0) ||
      (activeTab === 'completed' && completedOrders.length > 0);
    if (hasData) return;
    if (newOrders.length > 0) { setActiveTab('new'); return; }
    if (activeOrders.length > 0) { setActiveTab('active'); return; }
    if (completedOrders.length > 0) { setActiveTab('completed'); return; }
    setActiveTab('new');
  }, [activeOrders.length, activeTab, completedOrders.length, newOrders.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <p className="text-[13px] font-bold text-slate-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 py-10">
        <div className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <AlertCircle size={28} className="mx-auto text-red-400" />
          <p className="mt-4 text-[15px] font-black text-slate-900">Buyurtmalar yuklanmadi</p>
          <p className="mt-2 text-[13px] text-slate-500">{(error as Error).message}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-5 flex h-12 items-center gap-2 rounded-2xl bg-slate-900 px-5 text-[13px] font-black text-white mx-auto active:scale-95 transition-transform"
          >
            <RefreshCw size={15} />
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  const tabs: Array<{ key: CourierOrdersTab; label: string; count: number }> = [
    { key: 'new', label: 'Yangi', count: newOrders.length },
    { key: 'active', label: 'Faol', count: activeOrders.length },
    { key: 'completed', label: 'Tugatilgan', count: completedOrders.length },
  ];

  const currentOrders =
    activeTab === 'new' ? newOrders : activeTab === 'active' ? activeOrders : completedOrders;
  const highlightedActive = activeOrders[0] ?? null;

  const emptyText =
    activeTab === 'new'
      ? "Yangi biriktirilgan buyurtma yo'q"
      : activeTab === 'active'
        ? "Faol yetkazib berish yo'q"
        : "Bugun tugatilgan buyurtma yo'q";

  return (
    <div className="space-y-3 px-4 py-5 pb-32">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-[22px] font-black text-slate-900">Kuryer operatsiyasi</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 active:scale-95 transition-transform"
        >
          <RefreshCw size={17} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Tab switcher ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-col items-center gap-1 rounded-2xl py-3 transition-colors ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-100 text-slate-500'
            }`}
          >
            <span
              className={`text-[22px] font-black leading-none ${
                activeTab === tab.key ? 'text-white' : 'text-slate-900'
              }`}
            >
              {tab.count}
            </span>
            <span className={`text-[11px] font-bold ${activeTab === tab.key ? 'text-white/70' : 'text-slate-400'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Active route shortcut ────────────────────────────────────── */}
      {highlightedActive && (
        <button
          type="button"
          onClick={() => navigate(`/courier/map/${highlightedActive.id}`)}
          className="flex w-full items-center justify-between rounded-2xl bg-emerald-500 px-4 py-3.5 text-left shadow-md shadow-emerald-200 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <Navigation size={18} className="text-white" />
            <div>
              <p className="text-[11px] font-bold text-emerald-100">Faol marshrut</p>
              <p className="text-[14px] font-black text-white">#{highlightedActive.orderNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] font-black text-white">
            <Map size={15} />
            <span>Xarita</span>
          </div>
        </button>
      )}

      {/* ── Orders list ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 pt-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          {activeTab === 'new'
            ? 'Yangi buyurtmalar'
            : activeTab === 'active'
              ? 'Faol buyurtmalar'
              : 'Tugatilgan buyurtmalar'}
        </p>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">
          {currentOrders.length} ta
        </span>
      </div>

      {currentOrders.length > 0 ? (
        <div className="space-y-3">
          {currentOrders.map((order) => (
            <CourierOrderCard
              key={order.id}
              order={order}
              onClick={() => navigate(`/courier/order/${order.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Package size={28} className="text-slate-300" />
          </div>
          <p className="text-[16px] font-black text-slate-700">Bo'sh</p>
          <p className="mt-1 text-[13px] text-slate-400">{emptyText}</p>
        </div>
      )}
    </div>
  );
};

export default CourierOrdersPage;
