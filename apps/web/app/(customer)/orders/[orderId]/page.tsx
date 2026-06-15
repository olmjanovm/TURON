'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2, MapPin, Package, Phone, X } from 'lucide-react';
import { useOrderDetail, useCancelOrder, ORDER_STATUS_META } from '@/hooks/use-customer';
import { OrderModifySheet } from '@/components/customer/order-modify-sheet';
import { useT } from '@/lib/i18n/locale-context';
import type { TranslationKey } from '@/lib/i18n/translations';

const STATUS_FLOW = ['PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'DELIVERING', 'DELIVERED'] as const;

const PAYMENT_LABEL: Record<string, string> = {
  CASH: 'Naqd',
  MANUAL_TRANSFER: "Bank o'tkazmasi",
  BANK_TRANSFER: "Bank o'tkazmasi",
  EXTERNAL_PAYMENT: 'Onlayn',
  CARD: 'Karta',
};

function formatDate(value: string) {
  return new Date(value).toLocaleString('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const t = useT();
  const router = useRouter();
  const { data: order, isLoading, isError } = useOrderDetail(orderId);
  const cancel = useCancelOrder();
  const [cancelling, setCancelling] = useState(false);
  const [modifyOpen, setModifyOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-[#c62020]" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="px-4 pt-10 text-center">
        <p className="text-base font-bold">Topilmadi</p>
        <Link href="/orders" className="mt-3 inline-block text-sm font-bold text-[#c62020]">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  const meta = ORDER_STATUS_META[order.orderStatus] ?? ORDER_STATUS_META.PENDING;
  const flowIndex = STATUS_FLOW.indexOf(order.orderStatus as (typeof STATUS_FLOW)[number]);
  const isCancelled = order.orderStatus === 'CANCELLED';
  const isFinal = isCancelled || order.orderStatus === 'DELIVERED';
  const grandTotal = order.total + (order.deliveryFee ?? 0) - (order.discountAmount ?? 0);

  const confirmCancel = () => {
    setCancelling(true);
    cancel.mutate(orderId, {
      onSettled: () => {
        setCancelling(false);
        setModifyOpen(false);
      },
    });
  };

  return (
    <div className="space-y-4 px-4 pb-6 pt-4">
      <div className="flex items-center justify-between">
        <Link
          href="/orders"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="text-center">
          <p className="text-base font-black text-slate-900 dark:text-slate-50">#{order.orderNumber}</p>
          <p className="text-[10px] text-slate-400">{formatDate(order.createdAt)}</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Status hero */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${meta.chip}`}>
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
          {t(`orders.status.${order.orderStatus}` as TranslationKey)}
        </span>

        {!isCancelled && (
          <div className="mt-4 flex items-start gap-1">
            {STATUS_FLOW.map((s, i) => {
              const done = i < flowIndex || (i === flowIndex && order.orderStatus === 'DELIVERED');
              const active = i === flowIndex && order.orderStatus !== 'DELIVERED';
              return (
                <div key={s} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full items-center">
                    {i > 0 && (
                      <div className={`-ml-1 h-0.5 flex-1 rounded-full ${i <= flowIndex ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    )}
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                        done
                          ? 'bg-emerald-500 text-white'
                          : active
                            ? 'bg-gradient-to-br from-[#c62020] to-[#f97316] text-white ring-4 ring-[#c62020]/15'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                      }`}
                    >
                      {done ? <Check size={12} strokeWidth={3} /> : i + 1}
                    </div>
                    {i < STATUS_FLOW.length - 1 && (
                      <div className={`-mr-1 h-0.5 flex-1 rounded-full ${i < flowIndex ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Address */}
      {(order.customerAddress?.addressText || order.deliveryAddress) && (
        <Section title={t('orders.detail.address')}>
          <div className="flex items-start gap-2">
            <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {order.customerAddress?.addressText ?? order.deliveryAddress}
            </p>
          </div>
        </Section>
      )}

      {/* Courier */}
      {order.courier && (
        <Section title={t('orders.detail.courier')}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">{order.courier.fullName}</p>
              {order.courier.phoneNumber && (
                <p className="text-xs text-slate-500">{order.courier.phoneNumber}</p>
              )}
            </div>
            {order.courier.phoneNumber && (
              <a
                href={`tel:${order.courier.phoneNumber}`}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.5)] active:scale-95"
                aria-label="call"
              >
                <Phone size={16} />
              </a>
            )}
          </div>
        </Section>
      )}

      {/* Items */}
      <Section title={t('orders.detail.items')}>
        <div className="space-y-2">
          {order.items.map((it, idx) => (
            <div
              key={`${it.id}-${idx}`}
              className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-900">
                {it.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imageUrl} alt={it.name} className="h-full w-full object-cover" />
                ) : (
                  <Package size={14} className="text-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{it.name}</p>
                <p className="text-[11px] text-slate-500">{it.price.toLocaleString('uz-UZ')} {t('common.currency')}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-slate-500">{it.quantity}×</p>
                <p className="text-sm font-black text-slate-900 tabular-nums dark:text-slate-50">
                  {(it.price * it.quantity).toLocaleString('uz-UZ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Summary */}
      <Section title={t('checkout.summary.title')}>
        <SumRow label={t('cart.subtotal')} value={order.total} />
        {(order.deliveryFee ?? 0) > 0 && <SumRow label={t('cart.delivery_fee')} value={order.deliveryFee} />}
        {(order.discountAmount ?? 0) > 0 && (
          <SumRow
            label={t('cart.discount')}
            value={-(order.discountAmount ?? 0)}
            tone="text-emerald-600 dark:text-emerald-300"
          />
        )}
        <div className="my-2 h-px bg-slate-100 dark:bg-slate-800" />
        <SumRow label={t('cart.total')} value={grandTotal} bold />
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800">
          <p className="text-xs font-bold text-slate-500">{t('orders.detail.payment')}</p>
          <p className="text-xs font-black text-slate-900 dark:text-slate-100">
            {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
          </p>
        </div>
      </Section>

      {/* Cancel / o'zgartirish — variant modalini ochadi */}
      {!isFinal && (order.orderStatus === 'PENDING' || order.orderStatus === 'PREPARING') && (
        <button
          type="button"
          onClick={() => setModifyOpen(true)}
          disabled={cancelling}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 text-sm font-black text-red-600 active:scale-95 disabled:opacity-50 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300"
        >
          {cancelling ? <Loader2 size={16} className="animate-spin" /> : <><X size={16} /> {t('orders.detail.cancel')}</>}
        </button>
      )}

      {modifyOpen && (
        <OrderModifySheet
          onClose={() => setModifyOpen(false)}
          onConfirmCancel={confirmCancel}
          onMessageAdmin={() => router.push(`/orders/${orderId}/chat`)}
          cancelling={cancelling}
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      {children}
    </div>
  );
}

function SumRow({ label, value, bold, tone }: { label: string; value: number; bold?: boolean; tone?: string }) {
  const t = useT();
  return (
    <div className={`flex items-center justify-between py-1 text-sm ${bold ? 'font-black' : ''}`}>
      <span className={bold ? 'text-slate-900 dark:text-slate-50' : 'text-slate-500'}>{label}</span>
      <span
        className={`tabular-nums ${tone ?? (bold ? 'text-slate-900 dark:text-slate-50' : 'text-slate-700 dark:text-slate-300')}`}
      >
        {value.toLocaleString('uz-UZ')} {t('common.currency')}
      </span>
    </div>
  );
}
