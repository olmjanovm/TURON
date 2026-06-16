'use client';

import Link from 'next/link';
import { Package, MapPin, ChevronRight } from 'lucide-react';
import type { CourierOrderPreview } from '@/hooks/use-courier';

const ASSIGN_META: Record<string, { label: string; chip: string; dot: string }> = {
  ASSIGNED:   { label: 'Yangi',         chip: 'bg-[#c62020]/10 text-[#c62020]', dot: 'bg-[#c62020]' },
  ACCEPTED:   { label: 'Yo\'ldaman',    chip: 'bg-sky-50 text-sky-700',          dot: 'bg-sky-500' },
  PICKED_UP:  { label: 'Oldim',         chip: 'bg-violet-50 text-violet-700',    dot: 'bg-violet-500' },
  DELIVERING: { label: 'Yetkazyapman',  chip: 'bg-blue-50 text-blue-700',        dot: 'bg-blue-500' },
  DELIVERED:  { label: 'Topshirildi',   chip: 'bg-emerald-50 text-emerald-700',  dot: 'bg-emerald-500' },
  DECLINED:   { label: 'Rad etildi',    chip: 'bg-slate-100 text-slate-600',     dot: 'bg-slate-400' },
  CANCELLED:  { label: 'Bekor',         chip: 'bg-red-50 text-red-600',          dot: 'bg-red-500' },
};

export function OrderCard({ order }: { order: CourierOrderPreview }) {
  const meta = ASSIGN_META[order.courierAssignmentStatus ?? 'ASSIGNED'] ?? ASSIGN_META.ASSIGNED;
  const total = (order.total ?? 0) + (order.deliveryFee ?? 0);
  const address = order.customerAddress?.addressText ?? order.deliveryAddress ?? order.destinationAddress;

  return (
    <Link
      href={`/courier/order/${order.id}`}
      className="block rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Package size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-900">#{order.orderNumber ?? order.id.slice(0, 6)}</p>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.chip}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
          </div>
          {order.customerName && (
            <p className="mt-0.5 truncate text-xs font-medium text-slate-600">{order.customerName}</p>
          )}
          {address && (
            <div className="mt-1.5 flex items-start gap-1">
              <MapPin size={12} className="mt-0.5 shrink-0 text-slate-400" />
              <p className="line-clamp-2 text-[11px] text-slate-500">{address}</p>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm font-black text-slate-900 tabular-nums">
              {total.toLocaleString('uz-UZ')} <span className="text-[10px] font-medium text-slate-400">so&apos;m</span>
            </p>
            <ChevronRight size={14} className="text-slate-300" />
          </div>
        </div>
      </div>
    </Link>
  );
}
