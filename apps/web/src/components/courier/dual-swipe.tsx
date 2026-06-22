'use client';

import { useEffect, useRef, useState } from 'react';
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
 * SMOOTH (jank yo'q): drag paytida knob/fill DOM orqali (ref) bevosita
 * yangilanadi — React RE-RENDER QILMAYDI. Rang/ikona uchun setState faqat
 * requestAnimationFrame bilan throttle qilinadi (kadr/safar 1 marta).
 * Fill'lardagi CSS transition drag paytida O'CHIQ (lag yo'q), snap'da yoqiq.
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
  const knobRef = useRef<HTMLDivElement | null>(null);
  const declineFillRef = useRef<HTMLDivElement | null>(null);
  const acceptFillRef = useRef<HTMLDivElement | null>(null);

  // `progress` faqat RANG/IKONA uchun (rAF-throttled). Pozitsiya — ref orqali.
  const [progress, setProgress] = useState(0); // -1..+1
  const progressRef = useRef(0);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const KNOB = 56;
  const halfTravel = () => Math.max(40, ((trackRef.current?.clientWidth ?? 320) - KNOB - 8) / 2);

  const haptic = (kind: 'heavy' | 'light') => {
    try {
      (window as Window & { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred?: (s: string) => void } } } })
        .Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(kind);
    } catch {/* */}
  };

  // DOM'ga BEVOSITA yozish — re-render yo'q (smooth)
  const paint = (p: number) => {
    const max = halfTravel();
    if (knobRef.current) knobRef.current.style.transform = `translateX(calc(-50% + ${(p * max).toFixed(1)}px))`;
    if (declineFillRef.current) declineFillRef.current.style.width = `${(p < 0 ? Math.min(1, -p * 1.5) : 0) * 50}%`;
    if (acceptFillRef.current) acceptFillRef.current.style.width = `${(p > 0 ? Math.min(1, p * 1.5) : 0) * 50}%`;
  };

  const setSnapTransition = (on: boolean) => {
    if (knobRef.current) {
      knobRef.current.style.transition = on
        ? 'transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 150ms'
        : 'none';
    }
    const fillT = on ? 'width 160ms ease-out' : 'none';
    if (declineFillRef.current) declineFillRef.current.style.transition = fillT;
    if (acceptFillRef.current) acceptFillRef.current.style.transition = fillT;
  };

  // Boshlang'ich joylash
  useEffect(() => {
    paint(0);
    setSnapTransition(true);
    return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onStart = (clientX: number) => {
    if (disabled || busy) return;
    draggingRef.current = true;
    startXRef.current = clientX;
    setSnapTransition(false); // drag — transition O'CHIQ (instant, lag yo'q)
  };

  const onMove = (clientX: number) => {
    if (!draggingRef.current) return;
    const dx = clientX - startXRef.current;
    const p = Math.max(-1, Math.min(1, dx / halfTravel()));
    progressRef.current = p;
    paint(p); // DOM — DARHOL
    // Rang/ikona — rAF throttled (kadr/safar 1 marta setState)
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setProgress(progressRef.current);
      });
    }
  };

  const settle = (target: number) => {
    progressRef.current = target;
    setSnapTransition(true);
    paint(target);
    setProgress(target);
  };

  const onEnd = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const finalP = progressRef.current;
    if (finalP >= 0.6) { haptic('heavy'); settle(1); onAccept(); }
    else if (finalP <= -0.6) { haptic('heavy'); settle(-1); onDecline(); }
    else { settle(0); }
  };

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
      {/* Decline fill — ref orqali (width drag'da bevosita) */}
      <div
        ref={declineFillRef}
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-red-600"
        style={{ width: 0, willChange: 'width' }}
      />
      {/* Accept fill */}
      <div
        ref={acceptFillRef}
        className="absolute inset-y-0 right-0 bg-gradient-to-l from-emerald-500 to-emerald-600"
        style={{ width: 0, willChange: 'width' }}
      />

      {/* Labels */}
      <div className="pointer-events-none absolute inset-0 flex items-center">
        <div className="flex-1 pl-5">
          <span
            className={`flex items-center gap-1.5 text-[12px] font-black uppercase tracking-wider transition-colors ${
              progress < -0.2 ? 'text-white' : 'text-slate-400'
            }`}
          >
            <ChevronLeft size={14} />
            {declineLabel}
          </span>
        </div>
        <div className="flex-1 pr-5 text-right">
          <span
            className={`inline-flex items-center gap-1.5 text-[12px] font-black uppercase tracking-wider transition-colors ${
              progress > 0.2 ? 'text-white' : 'text-slate-400'
            }`}
          >
            {acceptLabel}
            <ChevronRight size={14} />
          </span>
        </div>
      </div>

      {/* Knob — pozitsiya ref orqali (transform), rang state orqali */}
      <div
        ref={knobRef}
        className={`pointer-events-none absolute left-1/2 top-1 flex h-[56px] w-[56px] items-center justify-center rounded-xl shadow-lg ${
          progress > 0.3
            ? 'bg-emerald-500 text-white'
            : progress < -0.3
              ? 'bg-red-500 text-white'
              : 'bg-white text-slate-900 dark:bg-slate-100'
        }`}
        style={{ willChange: 'transform' }}
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
