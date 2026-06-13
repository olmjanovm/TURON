'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Wallet, Activity, CheckCircle2, Package, ChevronRight, TrendingUp, MessageCircle } from 'lucide-react';
import { OrderStatusEnum } from '@turon/shared';
import { useAdminOrders } from '@/hooks/use-admin-orders';
import { SkeletonStatTile, SkeletonRow } from '@/components/ui/skeleton';
import { STATUS_META, statusMeta, orderMoney as money } from '@/lib/order-status';

export default function AdminDashboardPage() {
  const { data: orders, isLoading, isError } = useAdminOrders();

  const summary = useMemo(() => {
    const list = orders ?? [];
    const byStatus: Record<string, number> = {};
    let revenue = 0;
    for (const o of list) {
      byStatus[o.orderStatus] = (byStatus[o.orderStatus] ?? 0) + 1;
      if (o.orderStatus === OrderStatusEnum.DELIVERED) revenue += money(o);
    }
    const active =
      (byStatus[OrderStatusEnum.PENDING] ?? 0) +
      (byStatus[OrderStatusEnum.PREPARING] ?? 0) +
      (byStatus[OrderStatusEnum.READY_FOR_PICKUP] ?? 0) +
      (byStatus[OrderStatusEnum.DELIVERING] ?? 0);
    return { total: list.length, byStatus, revenue, active };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 w-full animate-pulse rounded-3xl bg-slate-200" />
        <div className="grid grid-cols-3 gap-3">
          <SkeletonStatTile />
          <SkeletonStatTile />
          <SkeletonStatTile />
        </div>
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="admin-card p-6 text-center text-sm text-slate-500">
        Ma'lumotlarni yuklashda xatolik. Iltimos, qayta urinib ko'ring.
      </div>
    );
  }

  const recent = (orders ?? []).slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Hero daromad karta — ember gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1b1f2a] via-[#161a24] to-[#0b1220] p-5 text-white shadow-[0_24px_48px_-20px_rgba(15,23,42,0.6)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full opacity-40 blur-2xl"
          style={{ background: 'radial-gradient(circle, var(--color-ember), transparent 70%)' }}
        />
        <p className="relative text-xs font-medium text-white/50">Bugungi tushum</p>
        <p className="admin-num relative mt-1 text-3xl font-black">
          {summary.revenue.toLocaleString('uz-UZ')}
          <span className="ml-1 text-sm font-semibold text-white/50">so'm</span>
        </p>
        <div className="relative mt-4 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            <TrendingUp size={13} /> {summary.byStatus[OrderStatusEnum.DELIVERED] ?? 0} yetkazildi
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
            {summary.active} faol
          </span>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-3 gap-3">
        <KpiTile icon={Package} tint="bg-slate-100 text-slate-600" label="Jami" value={summary.total} />
        <KpiTile icon={Activity} tint="bg-sky-50 text-sky-600" label="Faol" value={summary.active} />
        <KpiTile
          icon={CheckCircle2}
          tint="bg-emerald-50 text-emerald-600"
          label="Yetkazildi"
          value={summary.byStatus[OrderStatusEnum.DELIVERED] ?? 0}
        />
      </div>

      {/* Hisobot + Suhbat linklari */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/admin/reports" className="admin-card admin-card-interactive flex flex-col gap-2 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <TrendingUp size={18} />
          </span>
          <span className="text-sm font-bold text-slate-900">Hisobotlar</span>
          <span className="text-[11px] text-slate-400">Statistika · Excel</span>
        </Link>
        <Link href="/admin/chats" className="admin-card admin-card-interactive flex flex-col gap-2 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ember/10 text-ember">
            <MessageCircle size={18} />
          </span>
          <span className="text-sm font-bold text-slate-900">Suhbatlar</span>
          <span className="text-[11px] text-slate-400">Mijoz · Kuryer</span>
        </Link>
      </div>

      {/* Status breakdown */}
      <section className="admin-card admin-card-accent p-4 pt-5">
        <h2 className="mb-3 text-sm font-bold text-slate-900">Holatlar bo'yicha</h2>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(STATUS_META).map(([status, meta]) => (
            <div key={status} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5">
              <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
              <span className="admin-num text-sm font-bold text-slate-900">
                {summary.byStatus[status] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-900">So'nggi buyurtmalar</h2>
          <Link href="/admin/orders" className="text-xs font-semibold text-ember">
            Barchasi
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="admin-card p-6 text-center text-sm text-slate-400">Hozircha buyurtma yo'q</p>
        ) : (
          recent.map((o) => {
            const meta = statusMeta(o.orderStatus);
            return (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="admin-card admin-card-interactive flex items-center gap-3 p-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <Package size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">
                    #{o.orderNumber ?? o.id.slice(0, 6)}
                  </p>
                  <span className={`admin-pill mt-1 ${meta.chip}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </div>
                <span className="admin-num shrink-0 text-sm font-bold text-slate-900">
                  {money(o).toLocaleString('uz-UZ')}
                </span>
                <ChevronRight size={16} className="shrink-0 text-slate-300" />
              </Link>
            );
          })
        )}
      </section>
    </div>
  );
}

function KpiTile({
  icon: Icon,
  tint,
  label,
  value,
}: {
  icon: typeof Package;
  tint: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="admin-card p-3.5">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tint}`}>
        <Icon size={18} />
      </span>
      <p className="admin-num mt-3 text-xl font-black text-slate-900">{value}</p>
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
    </div>
  );
}
