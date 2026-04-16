import React from 'react';
import { AlertCircle, AlertTriangle, Home, RefreshCw, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── TuronSplashScreen - Centered logo on red background ──────────────────────

export const LoadingScreen: React.FC<{ message?: string }> = () => {
  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#C62828',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <img
        src="/turon-splash.png"
        alt="Turon Kafesi"
        style={{
          width: '85%',
          maxWidth: 360,
          objectFit: 'contain',
        }}
      />
    </div>
  );
};

// ─── Shared feedback states ───────────────────────────────────────────────────

export const ErrorStateCard: React.FC<{ title?: string; message: string; onRetry?: () => void }> = ({
  title = 'Xatolik yuz berdi',
  message,
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-300">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-500 shadow-sm">
      <AlertCircle size={32} />
    </div>
    <h3 className="mb-2 text-lg font-black leading-none tracking-tight text-slate-800">{title}</h3>
    <p className="mb-6 max-w-xs text-sm font-medium text-slate-500">{message}</p>
    {onRetry ? (
      <button
        onClick={onRetry}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-50 font-bold text-red-600 transition-colors active:bg-red-100"
      >
        <RefreshCw size={18} />
        Qayta urinish
      </button>
    ) : null}
  </div>
);

export const UnauthorizedState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center animate-in fade-in duration-300">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-rose-100 text-rose-600 shadow-sm">
        <ShieldAlert size={36} />
      </div>
      <h2 className="mb-2 text-2xl font-black tracking-tight text-slate-800">Ruxsat etilmagan</h2>
      <p className="mb-8 max-w-[280px] text-sm font-medium text-slate-500">
        Sizda ushbu sahifaga kirish huquqi yo'q yoki profilingiz tasdiqlanmagan.
      </p>
      <button
        onClick={() => navigate('/')}
        className="h-14 w-full rounded-2xl bg-slate-900 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 transition-transform active:scale-95"
      >
        Bosh sahifaga qaytish
      </button>
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center animate-in slide-in-from-bottom-4 duration-300">
      <div className="relative mb-8">
        <h1 className="text-8xl font-black text-slate-200">404</h1>
        <div className="absolute inset-0 flex items-center justify-center text-amber-500">
          <AlertTriangle size={48} className="drop-shadow-md" />
        </div>
      </div>
      <h2 className="mb-2 text-2xl font-black tracking-tight text-slate-800">Sahifa topilmadi</h2>
      <p className="mb-8 max-w-[280px] text-sm font-medium text-slate-500">
        Siz izlayotgan sahifa mavjud emas yoki nomi o'zgartirilgan bo'lishi mumkin.
      </p>
      <button
        onClick={() => navigate('/', { replace: true })}
        className="flex h-14 items-center gap-2 rounded-2xl bg-amber-500 px-8 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-amber-200 transition-transform active:scale-95 active:bg-amber-600"
      >
        <Home size={18} />
        Bosh sahifaga o'tish
      </button>
    </div>
  );
};
