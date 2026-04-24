import React from 'react';
import { AlertCircle, AlertTriangle, Home, RefreshCw, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── TuronSplashScreen - Animated centered logo + loading dots ────────────────

type LoadingScreenTone = 'customer' | 'ops-yellow';

const LOADING_SCREEN_TONES: Record<
  LoadingScreenTone,
  {
    background: string;
    overlayTop: string;
    overlayBottom: string;
    dot: string;
  }
> = {
  customer: {
    background: '#C62828',
    overlayTop: 'rgba(255,255,255,0.06)',
    overlayBottom: 'rgba(0,0,0,0.08)',
    dot: 'rgba(255,255,255,0.9)',
  },
  'ops-yellow': {
    background: 'linear-gradient(180deg, #F2C520 0%, #E6B616 52%, #C18D08 100%)',
    overlayTop: 'rgba(255,248,216,0.22)',
    overlayBottom: 'rgba(111,80,11,0.2)',
    dot: 'rgba(255,250,240,0.92)',
  },
};

export const LoadingScreen: React.FC<{ message?: string; tone?: LoadingScreenTone }> = ({
  tone = 'customer',
}) => {
  const currentTone = LOADING_SCREEN_TONES[tone];
  return (
    <>
      <style>{`
        @keyframes turon-splash-in {
          0%   { opacity: 0; transform: scale(0.72); }
          60%  { opacity: 1; transform: scale(1.04); }
          80%  { transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes turon-bg-in {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes turon-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.015); }
        }
        @keyframes turon-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-10px); opacity: 1; }
        }
      `}</style>

      <div
        style={{
          minHeight: '100dvh',
          width: '100%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: currentTone.background,
          overflow: 'hidden',
          animation: 'turon-bg-in 0.3s ease-out forwards',
          gap: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `radial-gradient(circle at 20% 16%, ${currentTone.overlayTop} 0%, transparent 28%),
                         radial-gradient(circle at 82% 84%, ${currentTone.overlayBottom} 0%, transparent 28%)`,
          }}
        />

        {/* Logo - transparent bg on red */}
        <img
          src="/turon-logo.png"
          alt="Turon Kafesi"
          style={{
            position: 'relative',
            zIndex: 1,
            width: '85%',
            maxWidth: 380,
            objectFit: 'contain',
            animation:
              'turon-splash-in 0.75s cubic-bezier(0.34,1.56,0.64,1) 0.1s both, turon-pulse 3s ease-in-out 1s infinite',
          }}
        />

        {/* 3 loading dots */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            gap: 10,
            marginTop: 48,
            alignItems: 'center',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: currentTone.dot,
                animation: `turon-dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </>
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
