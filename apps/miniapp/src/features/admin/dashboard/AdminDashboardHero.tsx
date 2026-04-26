import React from 'react';
import { AlertCircle, ArrowUpRight, Clock3, TrendingUp } from 'lucide-react';
import { formatFullMoney } from './dashboardUtils';

interface Props {
  currentTime: string;
  pendingCount: number;
  pendingValue: number;
  todayRevenue: number;
  activeCouriers: number;
  onOpenOrders: () => void;
  onOpenReports: () => void;
}

export function AdminDashboardHero({
  currentTime,
  pendingCount,
  pendingValue,
  todayRevenue,
  activeCouriers,
  onOpenOrders,
  onOpenReports,
}: Props) {
  return (
    <section className="adminx-zone-hero adminx-panel p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="adminx-kicker text-[rgba(255,250,240,0.58)]">Admin boshqaruvi</p>
          <h2 className="mt-2 text-[32px] font-black leading-none tracking-[-0.05em] text-white">
            Bugungi nazorat
          </h2>
        </div>
        <div className="adminx-chip border-white/10 bg-white/8 text-white/82">
          <Clock3 size={14} />
          {currentTime}
        </div>
      </div>

      <div className="adminx-hero-grid mt-5">
        <button type="button" onClick={onOpenOrders} className="adminx-urgent-card p-5 text-left">
          <div className="flex items-center justify-between gap-3">
            <span className="adminx-chip" data-tone="danger">
              <AlertCircle size={14} />
              Kutmoqda
            </span>
            <ArrowUpRight size={18} className="text-[var(--adminx-color-danger)]" />
          </div>

          <div className="mt-6 flex items-end gap-3">
            <div className="rounded-[22px] bg-[var(--adminx-color-danger)] px-5 py-4 text-white shadow-[0_18px_30px_rgba(214,69,69,0.24)]">
              <div className="text-[52px] font-black leading-none tracking-[-0.06em]">
                {pendingCount > 99 ? '99+' : pendingCount}
              </div>
            </div>
            <div className="pb-2">
              <p className="text-[24px] font-black leading-tight tracking-[-0.05em] text-[var(--adminx-color-ink)]">
                Tasdiq kerak
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--adminx-color-muted)]">
                {formatFullMoney(pendingValue)} kutmoqda
              </p>
            </div>
          </div>
        </button>

        <button type="button" onClick={onOpenReports} className="adminx-revenue-card p-5 text-left text-[var(--adminx-color-dark)]">
          <span className="adminx-chip border-black/6 bg-black/6 text-[var(--adminx-color-dark)]">
            <TrendingUp size={14} />
            Tushum
          </span>
          <p className="mt-6 text-[13px] font-bold uppercase tracking-[0.18em] text-[rgba(28,18,7,0.6)]">
            Bugungi daromad
          </p>
          <div className="mt-3 text-[48px] font-black leading-none tracking-[-0.06em] text-[var(--adminx-color-dark)]">
            {todayRevenue.toLocaleString('uz-UZ')}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-sm font-semibold text-[rgba(28,18,7,0.7)]">
            <span>{activeCouriers} kuryer yo'lda</span>
            <span>So'm</span>
          </div>
        </button>
      </div>
    </section>
  );
}
