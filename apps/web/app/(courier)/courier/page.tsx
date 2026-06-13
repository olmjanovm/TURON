'use client';

import { useState } from 'react';
import { Package, CheckCircle2, Clock, ChevronRight, Bike, TrendingUp, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  useCourierOrders,
  useCourierStatus,
  useCourierStats,
  useUpdateCourierStatus,
  useOrderAction,
} from '@/hooks/use-courier';
import { Skeleton } from '@/components/ui/skeleton';

const ORDER_STATUS_META: Record<string, { label: string; dot: string; chip: string }> = {
  PENDING:          { label: 'Kutilmoqda',     dot: 'bg-amber-400',   chip: 'bg-amber-50 text-amber-700' },
  PREPARING:        { label: 'Tayyorlanmoqda', dot: 'bg-sky-400',     chip: 'bg-sky-50 text-sky-700' },
  READY_FOR_PICKUP: { label: 'Tayyor',         dot: 'bg-violet-400',  chip: 'bg-violet-50 text-violet-700' },
  DELIVERING:       { label: 'Yetkazilmoqda',  dot: 'bg-blue-400',    chip: 'bg-blue-50 text-blue-700' },
  DELIVERED:        { label: 'Yetkazildi',     dot: 'bg-emerald-400', chip: 'bg-emerald-50 text-emerald-700' },
  CANCELLED:        { label: 'Bekor qilindi',  dot: 'bg-red-400',     chip: 'bg-red-50 text-red-700' },
};

const NEXT_ACTION: Record<string, { label: string; action: string } | null> = {
  READY_FOR_PICKUP: { label: 'Restoranga yetdim',  action: 'arrived-restaurant' },
  DELIVERING:       { label: 'Yetkazib berdim',     action: 'deliver' },
};

export default function CourierPage() {
  const { user } = useAuth();
  const { data: orders, isLoading: ordersLoading } = useCourierOrders();
  const { data: statusData, isLoading: statusLoading } = useCourierStatus();
  const { data: stats } = useCourierStats();
  const updateStatus = useUpdateCourierStatus();
  const orderAction = useOrderAction();
  const [actioningId, setActioningId] = useState<string | null>(null);

  const isOnline = statusData?.isOnline ?? false;
  const activeOrders = (orders ?? []).filter(
    (o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED',
  );
  const completedToday = (orders ?? []).filter((o) => o.orderStatus === 'DELIVERED').length;

  const handleToggle = () => {
    updateStatus.mutate(!isOnline);
  };

  const handleAction = async (orderId: string, action: string) => {
    setActioningId(orderId);
    try {
      await orderAction.mutateAsync({ orderId, action });
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <header
        className="relative overflow-hidden bg-gradient-to-br from-[#1b1f2a] via-[#161a24] to-[#0b1220] px-5 pb-6 text-white"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full opacity-30 blur-2xl"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }}
        />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white/50">Kuryer paneli</p>
            <h1 className="mt-0.5 text-xl font-black tracking-tight">
              {user?.fullName ?? 'Kuryer'}
            </h1>
          </div>
          <button
            type="button"
            onClick={handleToggle}
            disabled={updateStatus.isPending || statusLoading}
            className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold transition active:scale-95 disabled:opacity-60"
          >
            {isOnline ? (
              <>
                <ToggleRight size={18} className="text-emerald-400" />
                <span className="text-emerald-300">Online</span>
              </>
            ) : (
              <>
                <ToggleLeft size={18} className="text-white/40" />
                <span className="text-white/60">Offline</span>
              </>
            )}
          </button>
        </div>

        {/* Stats strip */}
        <div className="relative mt-4 flex gap-3">
          <StatChip
            icon={CheckCircle2}
            value={stats?.deliveriesCompleted ?? completedToday}
            label="Bugun"
            color="text-emerald-300"
          />
          <StatChip
            icon={TrendingUp}
            value={`${(stats?.totalEarnings ?? 0).toLocaleString('uz-UZ')} so'm`}
            label="Daromad"
            color="text-sky-300"
          />
          <StatChip
            icon={Package}
            value={activeOrders.length}
            label="Faol"
            color="text-amber-300"
          />
        </div>
      </header>

      {/* Orders */}
      <div className="px-4 pt-4 space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Faol buyurtmalar</h2>

        {ordersLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-2">
              <Skeleton className="h-4 w-1/3" rounded="rounded-md" />
              <Skeleton className="h-3 w-2/3" rounded="rounded-md" />
              <Skeleton className="h-3 w-1/2" rounded="rounded-md" />
            </div>
          ))
        ) : activeOrders.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
            <Bike size={36} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">Hozircha faol buyurtma yo'q</p>
            <p className="mt-1 text-xs text-slate-400">
              {isOnline ? "Yangi buyurtma kelishini kuting" : "Online bo'ling — buyurtmalar keladi"}
            </p>
          </div>
        ) : (
          activeOrders.map((order) => {
            const meta = ORDER_STATUS_META[order.orderStatus] ?? ORDER_STATUS_META.PENDING;
            const nextAct = NEXT_ACTION[order.orderStatus] ?? null;
            const isActioning = actioningId === order.id;

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                      <Package size={18} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        #{order.orderNumber ?? order.id.slice(0, 6)}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold mt-0.5 ${meta.chip}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">
                      {(order.totalAmount + (order.deliveryFee ?? 0)).toLocaleString('uz-UZ')}
                    </p>
                    <p className="text-[11px] text-slate-400">so'm</p>
                  </div>
                </div>

                {order.deliveryAddress && (
                  <div className="mt-3 flex items-start gap-2">
                    <ChevronRight size={14} className="mt-0.5 shrink-0 text-slate-400" />
                    <p className="text-xs text-slate-500 line-clamp-2">{order.deliveryAddress}</p>
                  </div>
                )}

                {order.customer && (
                  <p className="mt-1 ml-5 text-xs font-medium text-slate-600">
                    {order.customer.fullName}
                    {order.customer.phoneNumber ? ` · ${order.customer.phoneNumber}` : ''}
                  </p>
                )}

                {nextAct && (
                  <button
                    type="button"
                    disabled={isActioning}
                    onClick={() => handleAction(order.id, nextAct.action)}
                    className="mt-3 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white transition active:scale-95 disabled:opacity-60"
                  >
                    {isActioning ? (
                      <span className="flex items-center justify-center gap-2">
                        <Clock size={14} className="animate-spin" />
                        Yuborilmoqda…
                      </span>
                    ) : (
                      nextAct.label
                    )}
                  </button>
                )}
              </div>
            );
          })
        )}

        {/* Completed today */}
        {!ordersLoading && completedToday > 0 && (
          <>
            <h2 className="pt-2 text-sm font-bold text-slate-900">Bugun yetkazildi</h2>
            {(orders ?? [])
              .filter((o) => o.orderStatus === 'DELIVERED')
              .map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 opacity-60 shadow-sm"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      #{order.orderNumber ?? order.id.slice(0, 6)}
                    </p>
                  </div>
                  <p className="text-sm font-black text-slate-700">
                    {(order.totalAmount + (order.deliveryFee ?? 0)).toLocaleString('uz-UZ')}
                  </p>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}

function StatChip({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof Package;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white/10 px-3 py-2">
      <Icon size={14} className={color} />
      <div>
        <p className={`text-xs font-black ${color}`}>{value}</p>
        <p className="text-[10px] text-white/50">{label}</p>
      </div>
    </div>
  );
}
