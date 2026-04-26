import React from 'react';
import { ArrowUpRight, Clock3 } from 'lucide-react';

interface Props {
  currentTime: string;
  pendingCount: number;
  pendingValue: number;
  todayRevenue: number;
  activeCouriers: number;
  activeOrdersCount: number;
  deliveredTodayCount: number;
  onOpenOrders: () => void;
  onOpenReports: () => void;
}

export function AdminDashboardHero({
  currentTime,
  pendingCount,
  todayRevenue,
  activeCouriers,
  activeOrdersCount,
  deliveredTodayCount,
  onOpenOrders,
  onOpenReports,
}: Props) {
  return (
    <section className="adminx-zone-hero adminx-revenue-hero">
      <button type="button" onClick={onOpenReports} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="adminx-kicker text-[rgba(28,18,7,0.55)]">Bugungi daromad</p>
            <div className="adminx-revenue-amount mt-2">
              {todayRevenue.toLocaleString('uz-UZ')}
            </div>
            <p className="mt-1.5 text-[13px] font-semibold text-[rgba(28,18,7,0.52)]">
              So'm &nbsp;·&nbsp; {deliveredTodayCount} ta yetkazildi
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="adminx-chip border-black/8 bg-black/8 text-[rgba(28,18,7,0.65)]">
              <Clock3 size={14} />
              {currentTime}
            </div>
            <div className="flex items-center gap-1 rounded-full border border-black/8 bg-black/8 px-2.5 py-1 text-[10px] font-black tracking-[0.1em] text-[rgba(28,18,7,0.52)]">
              <ArrowUpRight size={12} />
              Hisobot
            </div>
          </div>
        </div>
      </button>

      <div className="adminx-hero-mini-stats mt-5">
        <button type="button" onClick={onOpenOrders} className="adminx-hero-mini-stat text-left">
          <span>Faol</span>
          <strong>{activeOrdersCount}</strong>
        </button>
        <button
          type="button"
          onClick={onOpenOrders}
          className="adminx-hero-mini-stat text-left"
          data-tone={pendingCount > 0 ? 'danger' : undefined}
        >
          <span>Kutmoqda</span>
          <strong>{pendingCount}</strong>
        </button>
        <button type="button" className="adminx-hero-mini-stat text-left">
          <span>Kuryer</span>
          <strong>{activeCouriers}</strong>
        </button>
      </div>
    </section>
  );
}
