'use client';

import { use } from 'react';
import Link from 'next/link';
import { ChevronLeft, Phone, User, Truck } from 'lucide-react';
import { OrderStatusEnum } from '@turon/shared';
import { useAdminOrder, useUpdateOrderStatus } from '@/hooks/use-admin-orders';
import { statusMeta, orderMoney, NEXT_STATUS } from '@/lib/order-status';
import { Skeleton, SkeletonRow } from '@/components/ui/skeleton';

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const { data: order, isLoading, isError } = useAdminOrder(orderId);
  const updateStatus = useUpdateOrderStatus(orderId);

  return (
    <div className="space-y-4">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500"
      >
        <ChevronLeft size={18} /> Buyurtmalar
      </Link>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" rounded="rounded-2xl" />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : isError || !order ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Buyurtma topilmadi yoki yuklashda xatolik.
        </div>
      ) : (
        <OrderBody
          order={order}
          onAdvance={(s) => updateStatus.mutate(s)}
          isUpdating={updateStatus.isPending}
        />
      )}
    </div>
  );
}

function OrderBody({
  order,
  onAdvance,
  isUpdating,
}: {
  order: NonNullable<ReturnType<typeof useAdminOrder>['data']>;
  onAdvance: (s: OrderStatusEnum) => void;
  isUpdating: boolean;
}) {
  const meta = statusMeta(order.orderStatus);
  const next = NEXT_STATUS[order.orderStatus];
  const terminal =
    order.orderStatus === OrderStatusEnum.DELIVERED ||
    order.orderStatus === OrderStatusEnum.CANCELLED;

  return (
    <>
      {/* Sarlavha karta */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">
            #{order.orderNumber ?? order.id.slice(0, 6)}
          </h1>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        </div>
        {order.createdAt && (
          <p className="mt-1 text-xs text-slate-400">
            {new Date(order.createdAt).toLocaleString('uz-UZ')}
          </p>
        )}
      </div>

      {/* Mijoz */}
      {(order.customerName || order.customerPhone) && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <User size={16} className="text-slate-400" />
            <span className="font-medium">{order.customerName ?? 'Mijoz'}</span>
          </div>
          {order.customerPhone && (
            <a href={`tel:${order.customerPhone}`} className="mt-2 flex items-center gap-2 text-sm text-sky-600">
              <Phone size={16} /> {order.customerPhone}
            </a>
          )}
          {order.courierName && (
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <Truck size={16} className="text-slate-400" /> {order.courierName}
            </div>
          )}
        </div>
      )}

      {/* Mahsulotlar */}
      {order.items && order.items.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Mahsulotlar</h2>
          <div className="space-y-2">
            {order.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {(it.name ?? it.productName ?? 'Mahsulot')}{' '}
                  <span className="text-slate-400">×{it.quantity ?? 1}</span>
                </span>
                <span className="font-medium text-slate-900">
                  {((it.price ?? 0) * (it.quantity ?? 1)).toLocaleString('uz-UZ')} so'm
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hisob-kitob */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <Row label="Mahsulotlar" value={order.subtotal} />
        {order.discount ? <Row label="Chegirma" value={-order.discount} /> : null}
        <Row label="Yetkazish" value={order.deliveryFee} />
        <div className="my-2 h-px bg-slate-100" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">Jami</span>
          <span className="text-base font-bold text-slate-900">
            {orderMoney(order).toLocaleString('uz-UZ')} so'm
          </span>
        </div>
        {order.paymentMethod && (
          <p className="mt-2 text-xs text-slate-400">
            To'lov: {order.paymentMethod} · {order.paymentStatus ?? '—'}
          </p>
        )}
      </div>

      {/* Harakatlar */}
      {!terminal && (
        <div className="space-y-2">
          {next && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onAdvance(next.next)}
              className="w-full rounded-2xl bg-sky-600 py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
            >
              {isUpdating ? 'Bajarilmoqda…' : next.label}
            </button>
          )}
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onAdvance(OrderStatusEnum.CANCELLED)}
            className="w-full rounded-2xl border border-rose-200 bg-white py-3 text-sm font-semibold text-rose-600 transition active:scale-[0.99] disabled:opacity-60"
          >
            Buyurtmani bekor qilish
          </button>
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value?: number }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-700">{value.toLocaleString('uz-UZ')} so'm</span>
    </div>
  );
}
