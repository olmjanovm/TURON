'use client';

import { useMemo, useState } from 'react';
import { Wallet, Percent, Users, ShoppingBag, FileSpreadsheet, Loader2 } from 'lucide-react';
import { OrderStatusEnum } from '@turon/shared';
import { useReportStats, downloadReportExcel, type ReportTimeframe } from '@/hooks/use-admin-reports';
import { statusMeta } from '@/lib/order-status';
import { SkeletonStatTile } from '@/components/ui/skeleton';

const FRAMES: { value: ReportTimeframe; label: string }[] = [
  { value: 'today', label: 'Bugun' },
  { value: 'week', label: 'Hafta' },
  { value: 'month', label: 'Oy' },
  { value: 'year', label: 'Yil' },
];

export default function AdminReportsPage() {
  const [timeframe, setTimeframe] = useState<ReportTimeframe>('today');
  const { data, isLoading, isError } = useReportStats(timeframe);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const totalOrders = useMemo(
    () => (data?.orders ?? []).reduce((n, o) => n + o.count, 0),
    [data],
  );

  async function onExport() {
    setExportError('');
    setExporting(true);
    try {
      await downloadReportExcel(timeframe);
    } catch {
      setExportError('Eksport bajarilmadi');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Timeframe tablari */}
      <div className="flex gap-2">
        {FRAMES.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setTimeframe(f.value)}
            className={`flex-1 rounded-2xl py-2.5 text-sm font-bold transition ${
              timeframe === f.value
                ? 'bg-gradient-to-r from-ember to-orange-500 text-white shadow-sm shadow-ember/30'
                : 'border border-slate-200 bg-white text-slate-500'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          <SkeletonStatTile /><SkeletonStatTile /><SkeletonStatTile /><SkeletonStatTile />
        </div>
      ) : isError || !data ? (
        <div className="admin-card p-6 text-center text-sm text-slate-500">Hisobotni yuklab bo'lmadi.</div>
      ) : (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 gap-3">
            <Kpi icon={Wallet} tint="bg-emerald-50 text-emerald-600" label="Tushum" value={`${data.revenue.total.toLocaleString('uz-UZ')}`} suffix="so'm" />
            <Kpi icon={ShoppingBag} tint="bg-sky-50 text-sky-600" label="Buyurtmalar" value={totalOrders} />
            <Kpi icon={Percent} tint="bg-amber-50 text-amber-600" label="Chegirma" value={`${data.revenue.discount.toLocaleString('uz-UZ')}`} suffix="so'm" />
            <Kpi icon={Users} tint="bg-violet-50 text-violet-600" label="Yangi mijoz" value={data.newCustomers} />
          </div>

          {/* Status breakdown */}
          <section className="admin-card admin-card-accent p-4 pt-5">
            <h2 className="mb-3 text-sm font-bold text-slate-900">Holatlar bo'yicha</h2>
            <div className="space-y-2">
              {data.orders.length === 0 && <p className="py-2 text-center text-xs text-slate-400">Ma'lumot yo'q</p>}
              {data.orders.map((o) => {
                const meta = statusMeta(o.status as OrderStatusEnum);
                const pct = totalOrders > 0 ? Math.round((o.count / totalOrders) * 100) : 0;
                return (
                  <div key={o.status}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-slate-600">
                        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />{meta.label}
                      </span>
                      <span className="admin-num font-bold text-slate-900">{o.count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${meta.dot}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Excel eksport */}
          <button
            type="button"
            disabled={exporting}
            onClick={onExport}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 py-3.5 text-sm font-bold text-emerald-700 active:scale-[0.99] disabled:opacity-60"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            Excel hisobotni yuklab olish
          </button>
          {exportError && <p className="text-center text-xs text-rose-600">{exportError}</p>}
        </>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, tint, label, value, suffix }: { icon: typeof Wallet; tint: string; label: string; value: string | number; suffix?: string }) {
  return (
    <div className="admin-card p-4">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tint}`}><Icon size={18} /></span>
      <p className="admin-num mt-3 text-lg font-black text-slate-900">
        {value}{suffix ? <span className="ml-1 text-xs font-semibold text-slate-400">{suffix}</span> : null}
      </p>
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
    </div>
  );
}
