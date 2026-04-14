import React from 'react';
import { AlertCircle, AlertTriangle, Home, RefreshCw, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── 3-D food carousel data ───────────────────────────────────────────────────

const FOOD_ITEMS = [
  { emoji: '🍔', label: 'Burger',            glow: '#f59e0b', glow2: '#ef4444' },
  { emoji: '🍗', label: 'Qovurilgan tovuq',  glow: '#ef4444', glow2: '#f97316' },
  { emoji: '🥩', label: 'Steyk',             glow: '#e11d48', glow2: '#dc2626' },
  { emoji: '🍕', label: 'Pizza',             glow: '#f97316', glow2: '#fbbf24' },
  { emoji: '🌯', label: 'Sharwarma',         glow: '#fbbf24', glow2: '#f59e0b' },
  { emoji: '🥗', label: 'Yangi salat',       glow: '#22c55e', glow2: '#84cc16' },
  { emoji: '🍜', label: "Lag'mon",           glow: '#a78bfa', glow2: '#818cf8' },
  { emoji: '🍱', label: "Kombo to'plam",     glow: '#38bdf8', glow2: '#60a5fa' },
];

/** How long each food item stays on screen (ms). All animations are sync'd to this. */
const ITEM_MS = 2_200;

/**
 * Orbiting sparkle dots that circle the emoji.
 * r = orbit radius (px), dur = full revolution (s), delay = pre-offset (s, negative = start mid-orbit)
 */
const ORBITS = [
  { r: 84,  dur: 3.4, delay:  0,   size: 5 },
  { r: 100, dur: 4.7, delay: -1.9, size: 4 },
  { r: 112, dur: 5.3, delay: -3.2, size: 3 },
  { r: 70,  dur: 2.9, delay: -0.8, size: 4 },
];

// ─── LoadingScreen ────────────────────────────────────────────────────────────

export const LoadingScreen: React.FC<{ message?: string }> = () => {
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    const t = window.setInterval(() => setIdx(i => (i + 1) % FOOD_ITEMS.length), ITEM_MS);
    return () => window.clearInterval(t);
  }, []);

  const food = FOOD_ITEMS[idx];

  return (
    <>
      <style>{`
        /* ── 3-D flip: arrives from one side, holds centre, exits to other ── */
        @keyframes food3d {
          0%   { opacity:0; transform:perspective(700px) rotateY(-90deg) scale(0.5) translateZ(-60px); filter:blur(20px); }
          20%  { opacity:1; transform:perspective(700px) rotateY(12deg)  scale(1.22) translateZ(35px); filter:blur(0); }
          36%  { transform:perspective(700px) rotateY(-4deg) scale(1.07) translateZ(12px); }
          54%  { transform:perspective(700px) rotateY(0deg)  scale(1.02) translateZ(4px); }
          77%  { opacity:1; transform:perspective(700px) rotateY(0deg)  scale(1)    translateZ(0); filter:blur(0); }
          100% { opacity:0; transform:perspective(700px) rotateY(90deg)  scale(0.5) translateZ(-60px); filter:blur(20px); }
        }

        /* ── Ambient glow expands in, fades out with the food item ────────── */
        @keyframes ambientGlow {
          0%   { opacity:0;    transform:translate(-50%,-50%) scale(0.6); }
          22%  { opacity:0.85; transform:translate(-50%,-50%) scale(1.1); }
          65%  { opacity:0.5;  transform:translate(-50%,-50%) scale(1); }
          100% { opacity:0;    transform:translate(-50%,-50%) scale(0.75); }
        }

        /* ── Food name slides up in, holds, slides up out ─────────────────── */
        @keyframes labelIn {
          0%       { opacity:0; transform:translateY(14px) scale(0.94); }
          20%,75%  { opacity:1; transform:translateY(0)    scale(1); }
          100%     { opacity:0; transform:translateY(-10px) scale(0.94); }
        }

        /* ── Orbit paths (one per radius to avoid CSS-var-in-keyframe issues) */
        @keyframes orbit84  { from{transform:rotate(0deg)   translateX(84px)  rotate(0deg)}   to{transform:rotate(360deg)  translateX(84px)  rotate(-360deg)} }
        @keyframes orbit100 { from{transform:rotate(0deg)   translateX(100px) rotate(0deg)}   to{transform:rotate(360deg)  translateX(100px) rotate(-360deg)} }
        @keyframes orbit112 { from{transform:rotate(0deg)   translateX(112px) rotate(0deg)}   to{transform:rotate(360deg)  translateX(112px) rotate(-360deg)} }
        @keyframes orbit70  { from{transform:rotate(0deg)   translateX(70px)  rotate(0deg)}   to{transform:rotate(360deg)  translateX(70px)  rotate(-360deg)} }

        /* ── Sparkle twinkle ─────────────────────────────────────────────── */
        @keyframes twinkle {
          0%,100% { opacity:0.1;  transform:scale(0.5); }
          50%     { opacity:1;    transform:scale(1.5); }
        }

        /* ── Brand-name shimmer (gradient colours follow current food) ──── */
        @keyframes shimmer {
          0%   { background-position:-300% center; }
          100% { background-position:300% center; }
        }

        /* ── Bottom loading dots ─────────────────────────────────────────── */
        @keyframes dotPop {
          0%,80%,100% { transform:scale(0.65); opacity:0.3; }
          40%         { transform:scale(1.45); opacity:1; }
        }
      `}</style>

      <div
        style={{
          minHeight: '100dvh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg,#050810 0%,#0d1320 55%,#050810 100%)',
          overflow: 'hidden',
          position: 'relative',
          userSelect: 'none',
        }}
      >
        {/* ── Ambient colour glow — re-keyed so colours reset on food change ── */}
        <div
          key={`glow-${idx}`}
          style={{
            position: 'absolute',
            width: 380,
            height: 380,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${food.glow}2e 0%, ${food.glow2}12 44%, transparent 70%)`,
            animation: `ambientGlow ${ITEM_MS}ms ease-in-out both`,
            pointerEvents: 'none',
            top: '40%',
            left: '50%',
          }}
        />

        {/* ── Orbiting sparkle dots (colour updates live via inline style) ── */}
        {ORBITS.map((o, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              width: o.size,
              height: o.size,
              marginTop: -(o.size / 2),
              marginLeft: -(o.size / 2),
              borderRadius: '50%',
              background: food.glow,
              boxShadow: `0 0 8px ${food.glow}cc, 0 0 18px ${food.glow}66`,
              animation: `orbit${o.r} ${o.dur}s linear infinite, twinkle ${1.5 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${o.delay}s, ${i * 0.45}s`,
              pointerEvents: 'none',
              willChange: 'transform',
            }}
          />
        ))}

        {/* ── 3-D food emoji — re-keyed triggers fresh flip animation ─────── */}
        <div
          key={idx}
          style={{
            fontSize: 108,
            lineHeight: 1,
            animation: `food3d ${ITEM_MS}ms cubic-bezier(0.34,1.2,0.64,1) both`,
            filter: `drop-shadow(0 4px 28px ${food.glow}cc) drop-shadow(0 0 80px ${food.glow}44)`,
            position: 'relative',
            zIndex: 1,
            willChange: 'transform, opacity, filter',
          }}
        >
          {food.emoji}
        </div>

        {/* ── Food name — re-keyed so it slides in with each new item ─────── */}
        <div
          key={`name-${idx}`}
          style={{
            marginTop: 16,
            fontSize: 11,
            fontWeight: 800,
            color: food.glow,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            animation: `labelIn ${ITEM_MS}ms ease-in-out both`,
            textShadow: `0 0 22px ${food.glow}88`,
          }}
        >
          {food.label}
        </div>

        {/* ── Brand name — shimmer gradient colours follow current food ────── */}
        <div style={{ marginTop: 30, textAlign: 'center' }}>
          <p
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: '-0.04em',
              backgroundImage: `linear-gradient(90deg,#fff 10%,${food.glow} 36%,#fff 52%,${food.glow2} 70%,#fff 90%)`,
              backgroundSize: '300% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmer 2.8s linear infinite',
            }}
          >
            Turon Kafesi
          </p>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 9,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.22)',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
            }}
          >
            Mazali taomlar
          </p>
        </div>

        {/* ── Bouncing dots — colour follows current food ───────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: food.glow,
                animation: 'dotPop 1.3s ease-in-out infinite',
                animationDelay: `${i * 0.22}s`,
                boxShadow: `0 0 10px ${food.glow}99`,
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
