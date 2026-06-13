'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { RefreshCw, Navigation, CheckCircle2, Inbox } from 'lucide-react';
import { useCourierOrders } from '@/hooks/use-courier';
import { OrderCard } from '@/components/courier/order-card';
import { Skeleton } from '@/components/ui/skeleton';

type Tab = 'new' | 'active' | 'completed';

const TAB_META: { key: Tab; label: string; emptyTitle: string; emptyDesc: string; emptyIcon: typeof Inbox }[] = [
  { key: 'new',       label: 'Yangi',       emptyTitle: 'Buyurtma kutilmoqda',  emptyDesc: 'Online bo\'lsangiz, yangi topshiriqlar avtomatik keladi', emptyIcon: Navigation },
  { key: 'active',    label: 'Faol',        emptyTitle: 'Faol yetkazish yo\'q', emptyDesc: 'Yangi buyurtmani qabul qiling — marshrut boshlanadi',     emptyIcon: Navigation },
  { key: 'completed', label: 'Yakunlangan', emptyTitle: 'Hali yakunlanmagan',   emptyDesc: 'Birinchi yetkazishni tugatganingizdan so\'ng paydo bo\'ladi', emptyIcon: CheckCircle2 },
];

export default function CourierOrdersPage() {
  const { data: orders = [], isLoading, isFetching, refetch } = useCourierOrders();
  const [activeTab, setActiveTab] = useState<Tab>('new');
  const initDoneRef = useRef(false);

  const { newOrders, activeOrders, completedOrders } = useMemo(() => {
    return {
      newOrders: orders.filter((o) => o.courierAssignmentStatus === 'ASSIGNED'),
      activeOrders: orders.filter((o) =>
        ['ACCEPTED', 'PICKED_UP', 'DELIVERING'].includes(o.courierAssignmentStatus ?? ''),
      ),
      completedOrders: orders.filter((o) =>
        ['DELIVERED', 'DECLINED', 'CANCELLED'].includes(o.courierAssignmentStatus ?? ''),
      ),
    };
  }, [orders]);

  useEffect(() => {
    if (initDoneRef.current || isLoading) return;
    initDoneRef.current = true;
    if (activeOrders.length > 0) setActiveTab('active');
    else if (newOrders.length > 0) setActiveTab('new');
    else if (completedOrders.length > 0) setActiveTab('completed');
  }, [isLoading, activeOrders.length, newOrders.length, completedOrders.length]);

  const counts: Record<Tab, number> = {
    new: newOrders.length,
    active: activeOrders.length,
    completed: completedOrders.length,
  };

  const current =
    activeTab === 'new' ? newOrders : activeTab === 'active' ? activeOrders : completedOrders;
  const currentMeta = TAB_META.find((t) => t.key === activeTab)!;
  const EmptyIcon = currentMeta.emptyIcon;

  return (
    <div className="space-y-4 px-4 pb-6 pt-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kuryer paneli</p>
          <h1 className="mt-0.5 text-xl font-black tracking-tight text-slate-900">Buyurtmalar</h1>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm active:scale-95"
        >
          <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm flex gap-1">
        {TAB_META.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-[#c62020] to-[#f97316] text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.45)]'
                  : 'text-slate-500'
              }`}
            >
              <span className={`text-lg font-black leading-none tabular-nums ${isActive ? 'text-white' : 'text-slate-900'}`}>
                {counts[tab.key]}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-white/85' : 'text-slate-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-3 w-1 rounded-full bg-[#c62020]" />
          <p className="text-xs font-black text-slate-900">{currentMeta.label}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">
          {current.length} ta
        </span>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm space-y-2">
              <Skeleton className="h-4 w-1/3" rounded="rounded-md" />
              <Skeleton className="h-3 w-2/3" rounded="rounded-md" />
              <Skeleton className="h-3 w-1/2" rounded="rounded-md" />
            </div>
          ))}
        </div>
      ) : current.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <EmptyIcon size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-black text-slate-700">{currentMeta.emptyTitle}</p>
          <p className="mt-1 text-xs text-slate-500">{currentMeta.emptyDesc}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {current.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
