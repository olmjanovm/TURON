'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { OrderStatusEnum } from '@turon/shared';
import { useAdminOrders } from '@/hooks/use-admin-orders';
import { statusMeta, orderMoney } from '@/lib/order-status';
import { SkeletonRow } from '@/components/ui/skeleton';

const FILTERS: { value: 'ALL' | OrderStatusEnum; label: string }[] = [
  { value: 'ALL', label: 'Hammasi' },
  { value: OrderStatusEnum.PENDING, label: 'Yangi' },
  { value: OrderStatusEnum.PREPARING, label: 'Tayyorlanmoqda' },
  { value: OrderStatusEnum.DELIVERING, label: "Yo'lda" },
  { value: OrderStatusEnum.DELIVERED, label: 'Yetkazildi' },
  { value: OrderStatusEnum.CANCELLED, label: 'Bekor' },
];

export default function AdminOrdersPage() {
  const { data: orders, isLoading, isError } = useAdminOrders();
  const [filter, setFilter] = useState<'ALL' | OrderStatusEnum>('ALL');

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of orders ?? []) c[o.orderStatus] = (c[o.orderStatus] ?? 0) + 1;
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    const list = orders ?? [];
    return filter === 'ALL' ? list : list.filter((o) => o.orderStatus === filter);
  }, [orders, filter]);

  return (
    <div className="space-y-4">
      {/* Filtr chiplari — gorizontal scroll */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          const count = f.value === 'ALL' ? (orders?.length ?? 0) : (counts[f.value] ?? 0);
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'border-sky-600 bg-sky-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              {f.label}
              <span className={`rounded-full px-1.5 text-[10px] ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Buyurtmalarni yuklashda xatolik.
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-400">
          Bu holatda buyurtma yo'q
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => {
            const meta = statusMeta(o.orderStatus);
            return (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-colors active:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    #{o.orderNumber ?? o.id.slice(0, 6)}
                  </p>
                  <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.chip}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </div>
                <span className="shrink-0 text-sm font-bold text-slate-900">
                  {orderMoney(o).toLocaleString('uz-UZ')} so'm
                </span>
                <ChevronRight size={16} className="shrink-0 text-slate-300" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
