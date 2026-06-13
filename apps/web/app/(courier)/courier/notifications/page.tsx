'use client';

import Link from 'next/link';
import { ArrowLeft, Bell, Navigation, Package } from 'lucide-react';
import { useCourierOrders } from '@/hooks/use-courier';
import { Skeleton } from '@/components/ui/skeleton';

export default function CourierNotificationsPage() {
  const { data: orders = [], isLoading } = useCourierOrders();
  const newAssignments = orders.filter((o) => o.courierAssignmentStatus === 'ASSIGNED');

  return (
    <div className="space-y-4 px-4 pb-6 pt-5">
      <div className="flex items-center gap-3">
        <Link
          href="/courier"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Markaz</p>
          <h1 className="text-xl font-black tracking-tight text-slate-900">Bildirishnomalar</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" rounded="rounded-3xl" />
          ))}
        </div>
      ) : newAssignments.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm">
          <Bell size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-black text-slate-700">Yangi bildirishnoma yo&apos;q</p>
          <p className="mt-1 text-xs text-slate-500">
            Yangi buyurtmalar shu yerda paydo bo&apos;ladi
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {newAssignments.map((o) => (
            <Link
              key={o.id}
              href={`/courier/order/${o.id}`}
              className="block rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm transition active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-200/60">
                  <Navigation size={18} className="text-amber-800" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-amber-900">Yangi buyurtma</p>
                    <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black text-amber-900">
                      #{o.orderNumber}
                    </span>
                  </div>
                  {o.customerName && (
                    <p className="mt-0.5 text-xs text-amber-800/80">{o.customerName}</p>
                  )}
                  <p className="mt-0.5 text-xs font-bold text-amber-900">
                    {((o.total ?? 0) + (o.deliveryFee ?? 0)).toLocaleString('uz-UZ')} so&apos;m
                  </p>
                </div>
                <Package size={18} className="shrink-0 text-amber-700" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
