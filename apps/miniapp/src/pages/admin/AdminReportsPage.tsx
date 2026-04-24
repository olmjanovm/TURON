import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Loader2,
  Percent,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react';
import { env } from '../../config';
import { useAdminReportStats, type ReportTimeframe } from '../../hooks/queries/useAdminReports';

const TIMEFRAMES: ReportTimeframe[] = ['today', 'week', 'month', 'year'];

const AdminReportsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<ReportTimeframe>('today');
  const [isExporting, setIsExporting] = useState(false);

  const { data: stats, isLoading, isError, refetch, isFetching } = useAdminReportStats(timeframe);
  const orderCount = stats?.orders.reduce((sum, o) => sum + o.count, 0) ?? 0;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const url = `${env.API_URL}/reports/export?timeframe=${timeframe}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      window.setTimeout(() => setIsExporting(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-[calc(env(safe-area-inset-bottom,0px)+96px)]">
      <section className="admin-pro-card admin-hero-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/55">Analytics</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-white">Daromad va operatsion hisobotlar</h2>
            <p className="mt-1 text-sm font-medium text-white/70">Real vaqt raqamlari, eksport va status breakdown.</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="admin-pro-button-secondary flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl disabled:opacity-50"
            aria-label="Yangilash"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </section>

      <div className="admin-pro-card flex gap-1 rounded-[28px] p-2">
        {TIMEFRAMES.map((item) => (
          <button
            key={item}
            onClick={() => setTimeframe(item)}
            className={`flex-1 rounded-[22px] py-3 text-xs font-black uppercase tracking-wider transition-all ${
              timeframe === item
                ? 'admin-pro-button-primary text-[var(--admin-pro-primary-contrast)] shadow-[0_14px_28px_rgba(255,190,11,0.24)]'
                : 'text-[var(--admin-pro-text-muted)] hover:bg-[rgba(255,212,59,0.08)]'
            }`}
          >
            {item === 'today' ? 'Bugun' : item === 'week' ? 'Hafta' : item === 'month' ? 'Oy' : 'Yil'}
          </button>
        ))}
      </div>

      {isError ? (
        <div className="flex items-center gap-3 rounded-[20px] border border-red-100 bg-red-50 px-4 py-3">
          <span className="text-sm font-bold text-red-600">Ma'lumot yuklanmadi.</span>
          <button
            onClick={() => refetch()}
            className="ml-auto text-xs font-black text-red-500 underline"
          >
            Qayta urinish
          </button>
        </div>
      ) : null}

      <section className="admin-pro-card admin-hero-card relative overflow-hidden rounded-[32px] p-6 text-white">
        <div className="absolute right-0 top-0 h-32 w-32 -mr-10 -mt-10 rounded-full bg-white/10 blur-2xl" />
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/55">Umumiy daromad</p>

        {isLoading ? (
          <div className="mt-3 h-10 w-48 animate-pulse rounded-xl bg-white/20" />
        ) : (
          <h2 className="mt-2 text-4xl font-black tracking-tight">
            {(stats?.revenue.total ?? 0).toLocaleString()} <span className="text-lg opacity-60">so'm</span>
          </h2>
        )}

        <div className="mt-6 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5">
          <TrendingUp size={14} />
          <span className="text-xs font-bold">Real ma'lumot · {timeframe}</span>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <div className="admin-pro-card rounded-[26px] p-4">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,212,59,0.18)] text-[#7a5600]">
            <ShoppingBag size={20} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--admin-pro-text-muted)]">Buyurtmalar</p>
          {isLoading ? (
            <div className="mt-2 h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <p className="mt-1 text-2xl font-black text-[var(--admin-pro-text)]">{orderCount}</p>
          )}
        </div>

        <div className="admin-pro-card rounded-[26px] p-4">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#1f1a12] text-[#ffe39b]">
            <Users size={20} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--admin-pro-text-muted)]">Yangi mijozlar</p>
          {isLoading ? (
            <div className="mt-2 h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <p className="mt-1 text-2xl font-black text-[var(--admin-pro-text)]">+{stats?.newCustomers ?? 0}</p>
          )}
        </div>

        <div className="admin-pro-card col-span-2 flex items-center justify-between rounded-[26px] p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <Percent size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--admin-pro-text-muted)]">Chegirmalar</p>
              {isLoading ? (
                <div className="mt-1 h-6 w-28 animate-pulse rounded-lg bg-slate-100" />
              ) : (
                <p className="text-xl font-black text-[var(--admin-pro-text)]">{(stats?.revenue.discount ?? 0).toLocaleString()} so'm</p>
              )}
            </div>
          </div>
          <span className="rounded-full border border-[rgba(255,190,11,0.16)] bg-[rgba(255,212,59,0.14)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#7a5600]">
            Finans
          </span>
        </div>
      </div>

      {!isLoading && stats && stats.orders.length > 0 ? (
        <div className="admin-pro-card space-y-3 rounded-[26px] p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-[var(--admin-pro-text-muted)]">Status bo'yicha</p>
          {stats.orders.map((orderStat) => (
            <div key={orderStat.status} className="flex items-center justify-between">
              <span className="text-sm font-bold capitalize text-[var(--admin-pro-text-muted)]">
                {statusLabel(orderStat.status)}
              </span>
              <span className="text-sm font-black tabular-nums text-[var(--admin-pro-text)]">{orderStat.count}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="admin-pro-card relative overflow-hidden rounded-[32px] bg-[#1c170f] p-6 text-center text-white shadow-2xl">
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-[rgba(255,212,59,0.18)] blur-xl" />
        <FileSpreadsheet size={40} className="mx-auto mb-4 text-[var(--admin-pro-primary)]" />
        <h3 className="text-xl font-black">Excel formatida yuklab olish</h3>
        <p className="mt-2 text-sm font-bold leading-relaxed text-[#d2c0a1]">
          Tanlangan davr bo'yicha barcha buyurtmalar va moliyaviy ma'lumotlarni o'z ichiga oladi.
        </p>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="admin-pro-button-primary mt-6 flex h-[56px] w-full items-center justify-center gap-3 rounded-[22px] text-sm font-black uppercase tracking-widest disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              <Download size={20} />
              <span>Eksport (Excel)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'Kutilmoqda',
    CONFIRMED: 'Tasdiqlangan',
    PREPARING: 'Tayyorlanmoqda',
    READY_FOR_PICKUP: 'Tayyor',
    DELIVERING: 'Yetkazilmoqda',
    DELIVERED: 'Yetkazildi',
    CANCELLED: 'Bekor qilindi',
  };
  return map[status] ?? status;
}

export default AdminReportsPage;

