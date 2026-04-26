import React from 'react';
import { ArrowRight, ReceiptText } from 'lucide-react';
import type { Order } from '../../../data/types';
import { formatFullMoney, formatRelativeTime, getInitials } from './dashboardUtils';

interface Props {
  orders: Order[];
  onOpenAll: () => void;
  onOpenOrder: (orderId: string) => void;
}

const statusTone = (status: Order['orderStatus']) => {
  if (status === 'PENDING') return { label: 'Yangi', color: '#d64545', background: '#fff4f2' };
  if (status === 'DELIVERED') return { label: 'Yetkazildi', color: '#249f63', background: '#f0fff6' };
  return { label: 'Jarayonda', color: '#2d6cdf', background: '#eff5ff' };
};

export function AdminDashboardLiveFeed({ orders, onOpenAll, onOpenOrder }: Props) {
  const visibleOrders = orders.slice(0, 5);

  return (
    <section className="adminx-feed-shell adminx-home-feed-shell overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-4">
        <div>
          <p className="adminx-kicker text-[var(--adminx-color-faint)]">Jonli oqim</p>
          <h3 className="mt-1 text-[20px] font-black tracking-[-0.04em] text-[var(--adminx-color-ink)]">
            Oxirgi buyurtmalar
          </h3>
        </div>
        <button
          type="button"
          onClick={onOpenAll}
          className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.14em] text-[var(--adminx-color-primary-dark)]"
        >
          Hammasi
          <ArrowRight size={16} />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-[18px] bg-[var(--adminx-color-primary-soft)] text-[var(--adminx-color-primary-dark)]">
            <ReceiptText size={24} />
          </div>
          <p className="text-base font-black text-[var(--adminx-color-ink)]">Buyurtma yo'q</p>
          <p className="max-w-[240px] text-[13px] font-semibold leading-6 text-[var(--adminx-color-muted)]">
            Yangi buyurtmalar shu yerda ketma-ket chiqadi.
          </p>
        </div>
      ) : (
        <div>
          {visibleOrders.map((order, index) => {
            const tone = statusTone(order.orderStatus);
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => onOpenOrder(order.id)}
                className="adminx-home-feed-row w-full text-left"
                style={{ ['--i' as string]: index } as React.CSSProperties}
              >
                <div className="adminx-avatar" style={{ background: tone.background, color: tone.color }}>
                  {getInitials(order)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[14px] font-black text-[var(--adminx-color-ink)]">
                      {order.customerName?.trim() || `#${order.orderNumber}`}
                    </p>
                    <span className="adminx-chip min-h-[28px] px-3 text-[10px]" style={{ background: tone.background, color: tone.color, borderColor: `${tone.color}1f` }}>
                      <span className="h-2 w-2 rounded-full" style={{ background: tone.color }} />
                      {tone.label}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[12px] font-semibold text-[var(--adminx-color-muted)]">
                    {formatRelativeTime(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-black text-[var(--adminx-color-ink)]">{formatFullMoney(order.total)}</p>
                  <p className="mt-1 text-[11px] font-semibold text-[var(--adminx-color-faint)]">#{order.orderNumber}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
