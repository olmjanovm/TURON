'use client';

import { useState } from 'react';
import { ChevronUp, MapPin, Package, Phone, X } from 'lucide-react';
import type { CourierOrderDetail } from '@/hooks/use-courier';

const PAYMENT_LABEL: Record<string, string> = {
  CASH: 'Naqd', CARD: 'Karta', BANK_TRANSFER: "O'tkazma", CLICK: 'Click', PAYME: 'Payme',
};

interface OrderSheetProps {
  order: CourierOrderDetail;
  stageLabel: string;
  routeMeta: string;
  children: React.ReactNode; // SwipeConfirm yoki shunga o'xshash
  onCall?: () => void;
}

/**
 * Dark navigator bottom sheet — collapsed: stage + ETA + swipe.
 * Expanded: customer, items, payment.
 */
export function OrderSheet({ order, stageLabel, routeMeta, children, onCall }: OrderSheetProps) {
  const [expanded, setExpanded] = useState(false);
  const total = (order.total ?? 0) + (order.deliveryFee ?? 0);
  const address = order.customerAddress?.addressText ?? order.deliveryAddress;

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[480px]">
      <div className="rounded-t-3xl bg-[#131316] shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.5)]">
        {/* Drag handle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full justify-center py-2.5"
          aria-label="toggle details"
        >
          <span className={`h-1 w-12 rounded-full bg-white/20 transition-colors ${expanded ? 'bg-white/40' : ''}`} />
        </button>

        {/* Stage + ETA + meta */}
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Hozirgi bosqich
              </p>
              <p className="mt-0.5 text-lg font-black text-white">{stageLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition ${
                expanded ? 'rotate-180' : ''
              }`}
              aria-label="expand"
            >
              <ChevronUp size={18} />
            </button>
          </div>
          <p className="mt-1 text-xs text-white/60">{routeMeta}</p>
        </div>

        {/* Expanded details */}
        <div
          className="overflow-hidden transition-[max-height] duration-300"
          style={{ maxHeight: expanded ? '420px' : '0px' }}
        >
          <div className="px-5 py-3 space-y-3">
            {/* Customer */}
            <div className="rounded-2xl bg-white/5 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Mijoz</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white">
                    {order.customerName ?? 'Mijoz'}
                  </p>
                  {address && (
                    <div className="mt-1 flex items-start gap-1.5">
                      <MapPin size={11} className="mt-0.5 shrink-0 text-white/40" />
                      <p className="line-clamp-2 text-[11px] text-white/60">{address}</p>
                    </div>
                  )}
                </div>
                {(order.customerPhone || onCall) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onCall) onCall();
                      else if (order.customerPhone) window.location.href = `tel:${order.customerPhone}`;
                    }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.55)] active:scale-95"
                    aria-label="call"
                  >
                    <Phone size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="rounded-2xl bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Buyurtma · {order.items.length} ta
                </p>
                <p className="text-sm font-black text-white tabular-nums">
                  {total.toLocaleString('uz-UZ')} <span className="text-[10px] font-medium text-white/40">so&apos;m</span>
                </p>
              </div>
              <div className="space-y-1.5">
                {order.items.slice(0, 3).map((it, idx) => (
                  <div key={`${it.id}-${idx}`} className="flex items-center gap-2 text-xs">
                    <Package size={11} className="text-white/30" />
                    <span className="line-clamp-1 flex-1 font-medium text-white/80">{it.name}</span>
                    <span className="font-bold text-white/60">{it.quantity}×</span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-[11px] text-white/40">va yana {order.items.length - 3} ta</p>
                )}
              </div>
            </div>

            {/* Payment */}
            <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                To&apos;lov
              </span>
              <span className="text-xs font-black text-white">
                {PAYMENT_LABEL[order.paymentMethod ?? ''] ?? order.paymentMethod ?? '—'}
              </span>
            </div>

            {order.note && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Izoh</p>
                <p className="mt-0.5 text-xs text-amber-100">{order.note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action */}
        <div
          className="px-5 pb-5"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 20px)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function MapTopBar({ orderNumber, onBack }: { orderNumber: string; onBack: () => void }) {
  return (
    <div
      className="pointer-events-auto absolute inset-x-0 top-0 z-20 mx-auto flex w-full max-w-[480px] items-center justify-between gap-3 px-4 pt-3"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
    >
      <button
        type="button"
        onClick={onBack}
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 text-slate-900 shadow-lg active:scale-95"
        aria-label="back"
      >
        <X size={18} />
      </button>
      <div className="rounded-2xl bg-white/95 px-4 py-2 shadow-lg">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Buyurtma</p>
        <p className="text-sm font-black text-slate-900">#{orderNumber}</p>
      </div>
      <div className="w-11" />
    </div>
  );
}
