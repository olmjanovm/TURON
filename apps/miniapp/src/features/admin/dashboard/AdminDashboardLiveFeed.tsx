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
  return (
    <section className="adminx-feed-shell overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
        <div>
          <p className="adminx-kicker text-[var(--adminx-color-faint)]">Live feed</p>
          <h3 className="mt-2 text-[24px] font-black tracking-[-0.04em] text-[var(--adminx-color-ink)]">
            Oxirgi buyurtmalar
          </h3>
        </div>
        <button
          type="button"
          onClick={onOpenAll}
          className="inline-flex items-center gap-2 text-sm font-black text-[var(--adminx-color-primary-dark)]"
        >
          Buyurtmalar
          <ArrowRight size={16} />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-[20px] bg-[var(--adminx-color-primary-soft)] text-[var(--adminx-color-primary-dark)]">
            <ReceiptText size={26} />
          </div>
          <p className="text-lg font-black text-[var(--adminx-color-ink)]">Hozircha buyurtma yo'q</p>
          <p className="max-w-[260px] text-sm font-semibold leading-6 text-[var(--adminx-color-muted)]">
            Yangi buyurtmalar shu yerda ketma-ket chiqadi.
          </p>
        </div>
      ) : (
        <div>
          {orders.map((order, index) => {
            const tone = statusTone(order.orderStatus);
            return (
              <button
                key={order.id}
                type="button"
                onClick={() => onOpenOrder(order.id)}
                className="adminx-feed-row w-full text-left"
                style={{ ['--i' as string]: index } as React.CSSProperties}
              >
                <div className="adminx-avatar" style={{ background: tone.background, color: tone.color }}>
                  {getInitials(order)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[15px] font-black text-[var(--adminx-color-ink)]">
                      {order.customerName?.trim() || `#${order.orderNumber}`}
                    </p>
                    <span className="adminx-chip" style={{ background: tone.background, color: tone.color, borderColor: `${tone.color}1f` }}>
                      <span className="h-2 w-2 rounded-full" style={{ background: tone.color }} />
                      {tone.label}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-[var(--adminx-color-muted)]">
                    {formatRelativeTime(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[15px] font-black text-[var(--adminx-color-ink)]">{formatFullMoney(order.total)}</p>
                  <p className="mt-1 text-xs font-semibold text-[var(--adminx-color-faint)]">#{order.orderNumber}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
