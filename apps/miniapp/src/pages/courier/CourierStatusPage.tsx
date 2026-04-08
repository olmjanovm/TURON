import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronRight, Loader2, Navigation } from 'lucide-react';
import {
  useCourierStatus,
  useCourierTodayStats,
  useUpdateCourierStatus,
} from '../../hooks/queries/useOrders';

// ─── iOS-style toggle ─────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-9 w-16 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-40 ${
        checked ? 'bg-emerald-500' : 'bg-slate-300'
      }`}
    >
      <span
        className={`ml-1 inline-block h-7 w-7 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
          checked ? 'translate-x-8' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

const CourierStatusPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    data: status,
    isLoading,
    error,
    refetch,
  } = useCourierStatus();
  const { data: todayStats } = useCourierTodayStats();
  const updateStatus = useUpdateCourierStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <p className="text-[13px] font-bold text-slate-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="px-5 py-10">
        <div className="rounded-[26px] border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertCircle size={26} className="text-red-500" />
          </div>
          <p className="text-[17px] font-black text-slate-900">Ulanib bo'lmadi</p>
          <p className="mt-2 text-[13px] text-slate-500">
            {(error as Error)?.message || "Server bilan bog'lanib bo'lmadi"}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-5 h-12 rounded-[18px] bg-slate-900 px-6 text-[13px] font-black text-white active:scale-95"
          >
            Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  const isOnline = status.isOnline;
  const completedToday = todayStats?.completedCount ?? status.completedToday ?? 0;
  const feesToday = todayStats?.deliveryFeesTotal ?? 0;
  const activeCount = status.activeAssignments ?? 0;

  // Single toggle: turns on/off both isOnline and isAcceptingOrders together
  const handleToggle = () => {
    updateStatus.mutate({
      isOnline: !isOnline,
      isAcceptingOrders: !isOnline, // sync with isOnline
    });
  };

  return (
    <div className="space-y-3 px-4 py-5">

      {/* ── Single online/offline toggle ────────────────────────────── */}
      <div className="rounded-[26px] bg-white border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[19px] font-black leading-tight text-slate-900">
              {isOnline ? 'Ishlamoqdaman' : 'Dam olmoqdaman'}
            </p>
            <p className="mt-1 text-[13px] text-slate-500">
              {isOnline
                ? 'Yangi topshiriqlar kelishi mumkin'
                : 'Hech qanday topshiriq kelmaydi'}
            </p>
          </div>
          {updateStatus.isPending ? (
            <Loader2 size={24} className="shrink-0 animate-spin text-slate-400" />
          ) : (
            <Toggle
              checked={isOnline}
              onChange={handleToggle}
              disabled={updateStatus.isPending}
            />
          )}
        </div>

        {/* Status pill */}
        <div className="mt-4">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-black ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            {isOnline ? 'Faol — buyurtma qabul qilmoqda' : 'Offline'}
          </span>
        </div>
      </div>


      {/* ── Today's stats strip ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[18px] bg-white border border-slate-100 shadow-sm p-4 text-center">
          <p className="text-[26px] font-black text-slate-900 leading-none">{completedToday}</p>
          <p className="mt-1.5 text-[11px] font-bold text-slate-400">Yetkazildi</p>
        </div>
        <div className="rounded-[18px] bg-white border border-slate-100 shadow-sm p-4 text-center">
          <p className="text-[26px] font-black text-slate-900 leading-none">{activeCount}</p>
          <p className="mt-1.5 text-[11px] font-bold text-slate-400">Faol</p>
        </div>
        <div className="rounded-[18px] bg-white border border-slate-100 shadow-sm p-4 text-center">
          <p className="text-[16px] font-black text-slate-900 leading-none">
            {feesToday > 0 ? `${(feesToday / 1000).toFixed(0)}K` : '—'}
          </p>
          <p className="mt-1.5 text-[11px] font-bold text-slate-400">Haqdorlik</p>
        </div>
      </div>

      {/* ── Offline onboarding hint ──────────────────────────────────── */}
      {!isOnline && (
        <div className="rounded-[22px] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white px-4 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-indigo-100 text-indigo-600">
              <Navigation size={17} />
            </div>
            <div>
              <p className="text-[14px] font-black text-slate-900">Ishni boshlash uchun</p>
              <p className="mt-1 text-[12px] leading-snug text-slate-500">
                Yuqoridagi{' '}
                <span className="font-black text-slate-700">"Ishlamoqdaman"</span>{' '}
                tugmasini yoqing. Shunda yangi buyurtmalar avtomatik keladi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick nav to orders list ─────────────────────────────────── */}
      <button
        type="button"
        onClick={() => navigate('/courier/orders')}
        className="flex w-full items-center justify-between rounded-[26px] bg-white border border-slate-100 shadow-sm px-5 py-4 active:scale-[0.98] transition-transform"
      >
        <p className="text-[15px] font-black text-slate-900">Barcha buyurtmalar</p>
        <ChevronRight size={20} className="text-slate-400" />
      </button>
    </div>
  );
};

export default CourierStatusPage;
