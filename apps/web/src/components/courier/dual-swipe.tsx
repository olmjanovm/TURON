'use client';

import { useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';

interface DualSwipeProps {
  acceptLabel: string;
  declineLabel: string;
  onAccept: () => void;
  onDecline: () => void;
  busy?: boolean;
  disabled?: boolean;
}

/**
 * Ikki tomonlama slider — chap=rad, o'ng=qabul.
 *
 * Muhim texnik nuanslar (qaytib ulashmaslik uchun):
 *   1. touch-action:none — brauzer swipe'ni page scroll deb tushunmasligi
 *   2. progressRef — state stale o'qish bug'i (React render kechikishi)
 *      eski versiyada `onEnd` `progress` state'ni o'qigan, lekin tezda
 *      release qilsa, state hali yangilanib ulgurmagan bo'lishi mumkin
 *   3. Butun TRACK sudraladi (faqat knob emas) — qulayroq
 *   4. Pointer + Touch event hammasi qo'llab-quvvatlanadi
 */
export function DualSwipe({
  acceptLabel,
  declineLabel,
  onAccept,
  onDecline,
  busy,
  disabled,
}: DualSwipeProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0); // -1..+1
  const progressRef = useRef(0); // state stale fix uchun mirror
  const draggingRef = useRef(false);
  const startXRef = useRef(0);

  const trackWidth = () => trackRef.current?.clientWidth ?? 320;
  const knobSize = 56;
  const halfTravel = () => Math.max(40, (trackWidth() - knobSize - 8) / 2);

  const haptic = (kind: 'heavy' | 'light') => {
    try {
      const tg = (window as Window & { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred?: (s: string) => void } } } })
        .Telegram?.WebApp?.HapticFeedback;
      tg?.impactOccurred?.(kind);
    } catch {/* ignore */}
  };

  const updateProgress = (p: number) => {
    progressRef.current = p;
    setProgress(p);
  };

  const onStart = (clientX: number) => {
    if (disabled || busy) return;
    draggingRef.current = true;
    startXRef.current = clientX;
  };

  const onMove = (clientX: number) => {
    if (!draggingRef.current) return;
    const dx = clientX - startXRef.current;
    const max = halfTravel();
    const p = Math.max(-1, Math.min(1, dx / max));
    updateProgress(p);
  };

  const onEnd = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const finalP = progressRef.current; // REF'dan o'qiymiz — stale state yo'q
    if (finalP >= 0.6) {
      updateProgress(1);
      haptic('heavy');
      onAccept();
    } else if (finalP <= -0.6) {
      updateProgress(-1);
      haptic('heavy');
      onDecline();
    } else {
      updateProgress(0);
    }
  };

  // Track ranglari — progressga qarab interpolate
  const accentAccept = progress > 0 ? Math.min(1, progress * 1.5) : 0;
  const accentDecline = progress < 0 ? Math.min(1, -progress * 1.5) : 0;

  return (
    <div
      ref={trackRef}
      className={`relative h-[64px] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 ${
        disabled ? 'opacity-40' : ''
      }`}
      onPointerDown={(e) => {
        if (disabled || busy) return;
        try { (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId); } catch {/* */}
        onStart(e.clientX);
      }}
      onPointerMove={(e) => onMove(e.clientX)}
      onPointerUp={(e) => {
        try { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId); } catch {/* */}
        onEnd();
      }}
      onPointerCancel={onEnd}
      onPointerLeave={() => { if (draggingRef.current) onEnd(); }}
      onTouchStart={(e) => onStart(e.touches[0]?.clientX ?? 0)}
      onTouchMove={(e) => {
        if (draggingRef.current && e.cancelable) e.preventDefault();
        onMove(e.touches[0]?.clientX ?? 0);
      }}
      onTouchEnd={onEnd}
      onTouchCancel={onEnd}
      style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Decline fill — chap tomondan o'ngga */}
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-red-600 transition-[width] duration-150 ease-out"
        style={{ width: `${accentDecline * 50}%` }}
      />
      {/* Accept fill — o'ng tomondan chapga */}
      <div
        className="absolute inset-y-0 right-0 bg-gradient-to-l from-emerald-500 to-emerald-600 transition-[width] duration-150 ease-out"
        style={{ width: `${accentAccept * 50}%` }}
      />

      {/* Labels (knob orqasida ko'rinadi) */}
      <div className="pointer-events-none absolute inset-0 flex items-center">
        <div className="flex-1 pl-5">
          <span
            className={`flex items-center gap-1.5 text-[12px] font-black uppercase tracking-wider transition-colors ${
              accentDecline > 0.3 ? 'text-white' : 'text-slate-400'
            }`}
          >
            <ChevronLeft size={14} />
            {declineLabel}
          </span>
        </div>
        <div className="flex-1 pr-5 text-right">
          <span
            className={`inline-flex items-center gap-1.5 text-[12px] font-black uppercase tracking-wider transition-colors ${
              accentAccept > 0.3 ? 'text-white' : 'text-slate-400'
            }`}
          >
            {acceptLabel}
            <ChevronRight size={14} />
          </span>
        </div>
      </div>

      {/* Knob — markazdan ikki tomonga, pointer-events:none (track o'zi ushlaydi) */}
      <div
        className={`pointer-events-none absolute top-1 flex h-[56px] w-[56px] items-center justify-center rounded-xl shadow-lg ${
          progress > 0.3
            ? 'bg-emerald-500 text-white'
            : progress < -0.3
              ? 'bg-red-500 text-white'
              : 'bg-white text-slate-900 dark:bg-slate-100'
        }`}
        style={{
          left: '50%',
          transform: `translateX(calc(-50% + ${progress * halfTravel()}px))`,
          transition: draggingRef.current ? 'none' : 'transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 150ms',
        }}
        aria-label="swipe"
      >
        {busy ? (
          <Loader2 size={22} className="animate-spin" />
        ) : progress > 0.3 ? (
          <Check size={22} strokeWidth={2.6} />
        ) : progress < -0.3 ? (
          <X size={22} strokeWidth={2.6} />
        ) : (
          <span className="flex items-center gap-0.5 text-slate-400">
            <ChevronLeft size={14} strokeWidth={2.8} />
            <ChevronRight size={14} strokeWidth={2.8} />
          </span>
        )}
      </div>
    </div>
  );
}
