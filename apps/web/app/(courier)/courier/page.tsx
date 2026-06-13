'use client';

import Link from 'next/link';
import { AlertCircle, Bell, ChevronRight, Loader2, Navigation, Package, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  useCourierStatus,
  useCourierStats,
  useCourierOrders,
  useUpdateCourierStatus,
} from '@/hooks/use-courier';

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-9 w-16 shrink-0 items-center rounded-full border transition-all duration-300 disabled:opacity-40 ${
        checked
          ? 'border-emerald-300 bg-emerald-500 shadow-[0_8px_18px_-6px_rgba(16,185,129,0.55)]'
          : 'border-slate-200 bg-slate-200'
      }`}
    >
      <span
        className={`ml-1 inline-block h-7 w-7 rounded-full bg-white shadow-md transition-transform duration-300 ${
          checked ? 'translate-x-7' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function CourierStatusPage() {
  const { user } = useAuth();
  const { data: status, isLoading, error, refetch } = useCourierStatus();
  const { data: stats } = useCourierStats();
  const { data: orders } = useCourierOrders();
  const updateStatus = useUpdateCourierStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-[#c62020]" />
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="px-4 py-10">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertCircle size={22} className="text-red-500" />
          </div>
          <p className="text-base font-black text-slate-900">Ulanib bo&apos;lmadi</p>
          <p className="mt-1 text-sm text-slate-500">
            {error instanceof Error ? error.message : 'Server bilan bog\'lanib bo\'lmadi'}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white active:scale-95"
          >
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  const isOnline = status.isOnline;
  const isAccepting = status.isAcceptingOrders;
  const completedToday = stats?.completedCount ?? status.completedToday ?? 0;
  const feesToday = stats?.deliveryFeesTotal ?? 0;
  const activeCount = status.activeAssignments ?? 0;
  const initials = (user?.fullName ?? 'K').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  const newAssignments = (orders ?? []).filter((o) => o.courierAssignmentStatus === 'ASSIGNED').length;

  const handleToggle = () => {
    updateStatus.mutate({ isOnline: !isOnline, isAcceptingOrders: !isOnline });
  };

  return (
    <div className="space-y-4 px-4 pb-6 pt-5">
      {/* Header card */}
      <div className="flex items-center gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-sm font-black text-white">
            {initials}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
              isOnline ? 'bg-emerald-500' : 'bg-slate-400'
            }`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-black text-slate-900">{user?.fullName ?? 'Kuryer'}</p>
          <p className="text-xs font-medium text-slate-500">
            {isOnline ? (isAccepting ? 'Faol — buyurtma qabul qiladi' : 'Onlayn, qabul yopiq') : 'Offline'}
          </p>
        </div>
        <Link
          href="/courier/notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm active:scale-95"
        >
          <Bell size={18} />
          {newAssignments > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c62020] px-1 text-[9px] font-black text-white">
              {newAssignments}
            </span>
          )}
        </Link>
      </div>

      {/* Work mode toggle */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ish rejimi</p>
            <p className="mt-1 text-xl font-black text-slate-900">
              {isOnline ? 'Ishlamoqdaman' : 'Dam olmoqdaman'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {isOnline ? 'Yangi topshiriqlar avtomatik keladi' : 'Hech qanday topshiriq kelmaydi'}
            </p>
          </div>
          {updateStatus.isPending ? (
            <Loader2 size={20} className="shrink-0 animate-spin text-[#c62020]" />
          ) : (
            <Toggle checked={isOnline} onChange={handleToggle} disabled={updateStatus.isPending} />
          )}
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-3 gap-3">
        <KpiTile icon={CheckCircle2} tint="bg-emerald-50 text-emerald-600" label="Yetkazildi" value={completedToday} />
        <KpiTile icon={Package} tint="bg-amber-50 text-amber-600" label="Faol" value={activeCount} />
        <KpiTile
          icon={TrendingUp}
          tint="bg-sky-50 text-sky-600"
          label="Daromad"
          value={feesToday > 0 ? `${Math.round(feesToday / 1000)}K` : '—'}
        />
      </div>

      {!isOnline && (
        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-200/60">
              <Navigation size={16} className="text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-black text-amber-900">Ishni boshlash uchun</p>
              <p className="mt-0.5 text-xs text-amber-800/80">
                Yuqoridagi <span className="font-black">Ishlamoqdaman</span> tugmasini yoqing — yangi buyurtmalar avtomatik keladi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick links */}
      <Link
        href="/courier/orders"
        className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition active:scale-[0.99]"
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tezkor o&apos;tish</p>
          <p className="mt-0.5 text-base font-black text-slate-900">Barcha buyurtmalar</p>
          {activeCount > 0 && (
            <p className="mt-1 text-xs text-emerald-600 font-semibold">{activeCount} faol topshiriq</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.45)]">
          <ChevronRight size={18} />
        </div>
      </Link>
    </div>
  );
}

function KpiTile({
  icon: Icon,
  tint,
  label,
  value,
}: {
  icon: typeof Package;
  tint: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tint}`}>
        <Icon size={16} />
      </span>
      <p className="mt-3 text-xl font-black text-slate-900 tabular-nums tracking-tight">{value}</p>
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
    </div>
  );
}
