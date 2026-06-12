'use client';

import { useMemo } from 'react';
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
        <div className="grid grid-cols-2 gap-3">
          <SkeletonStatTile />
          <SkeletonStatTile />
          <SkeletonStatTile />
          <SkeletonStatTile />
        </div>
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Ma'lumotlarni yuklashda xatolik. Iltimos, qayta urinib ko'ring.
      </div>
    );
  }

  const recent = (orders ?? []).slice(0, 6);

  return (
    <div className="space-y-5">
      {/* KPI tiles — oq kartalar */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Jami buyurtma" value={summary.total} />
        <StatTile label="Faol" value={summary.active} accent="text-sky-600" />
        <StatTile
          label="Yetkazildi"
          value={summary.byStatus[OrderStatusEnum.DELIVERED] ?? 0}
          accent="text-emerald-600"
        />
        <StatTile
          label="Tushum"
          value={`${summary.revenue.toLocaleString('uz-UZ')} so'm`}
          small
        />
      </div>

      {/* Status breakdown */}
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Holatlar bo'yicha</h2>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(STATUS_META).map(([status, meta]) => (
            <div key={status} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span className="flex items-center gap-2 text-xs text-slate-600">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
              <span className="text-sm font-bold text-slate-900">
                {summary.byStatus[status] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent orders */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">So'nggi buyurtmalar</h2>
        {recent.length === 0 ? (
          <p className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-400">
            Hozircha buyurtma yo'q
          </p>
        ) : (
          recent.map((o) => {
            const meta = STATUS_META[o.orderStatus] ?? { label: o.orderStatus, dot: 'bg-slate-400' };
            return (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    #{o.orderNumber ?? o.id.slice(0, 6)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {money(o).toLocaleString('uz-UZ')} so'm
                </span>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent = 'text-slate-900',
  small = false,
}: {
  label: string;
  value: string | number;
  accent?: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 font-bold ${accent} ${small ? 'text-base' : 'text-2xl'}`}>{value}</p>
    </div>
  );
}
