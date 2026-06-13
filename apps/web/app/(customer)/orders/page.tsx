'use client';

import Link from 'next/link';
import { ClipboardList, Loader2, Package, RefreshCw } from 'lucide-react';
import { useMyOrders, ORDER_STATUS_META, type CustomerOrder } from '@/hooks/use-customer';
import { useT } from '@/lib/i18n/locale-context';
import type { TranslationKey } from '@/lib/i18n/translations';

function formatDate(value: string) {
  return new Date(value).toLocaleString('uz-UZ', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function OrdersPage() {
  const t = useT();
  const { data: orders = [], isLoading, isFetching, refetch } = useMyOrders();

  return (
    <div className="space-y-4 px-4 pb-6 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-50">
          {t('orders.title')}
        </h1>
        <button
          type="button"
          onClick={() => void refetch()}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          aria-label="refresh"
        >
          <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[#c62020]" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: CustomerOrder }) {
  const t = useT();
  const meta = ORDER_STATUS_META[order.orderStatus] ?? ORDER_STATUS_META.PENDING;
  const total = order.total + (order.deliveryFee ?? 0);

  return (
    <Link
      href={`/orders/${order.id}`}
      className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <Package size={18} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-slate-50">#{order.orderNumber}</p>
            <p className="text-[10px] text-slate-400">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${meta.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {t(`orders.status.${order.orderStatus}` as TranslationKey)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <p className="text-xs text-slate-500">
          {order.items.length} {t('product.quantity').toLowerCase()}
        </p>
        <p className="text-base font-black text-slate-900 tabular-nums dark:text-slate-50">
          {total.toLocaleString('uz-UZ')}{' '}
          <span className="text-[10px] font-medium text-slate-400">{t('common.currency')}</span>
        </p>
      </div>
    </Link>
  );
}

function EmptyState() {
  const t = useT();
  return (
    <div className="mt-10 rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <ClipboardList size={24} className="text-slate-400" />
      </div>
      <p className="text-base font-black text-slate-900 dark:text-slate-100">{t('orders.empty.title')}</p>
      <p className="mt-1 text-xs text-slate-500">{t('orders.empty.desc')}</p>
      <Link
        href="/"
        className="mt-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] px-6 text-sm font-black text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.55)] active:scale-95"
      >
        {t('orders.empty.cta')}
      </Link>
    </div>
  );
}
