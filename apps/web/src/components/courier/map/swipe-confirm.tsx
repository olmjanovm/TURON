'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronsRight, Loader2 } from 'lucide-react';

interface SwipeConfirmProps {
  label: string;
  onConfirm: () => void;
  busy?: boolean;
  disabled?: boolean;
  tone?: 'primary' | 'success';
}

/**
 * Swipe-to-confirm — SMOOTH (jank yo'q). Drag paytida knob/fill DOM orqali (ref)
 * bevosita yangilanadi — React RE-RENDER QILMAYDI. CSS transition drag'da o'chiq
 * (lag yo'q), faqat snap'da yoqiq. setState faqat yakunda (✓ / reset).
 */
export function SwipeConfirm({ label, onConfirm, busy, disabled, tone = 'primary' }: SwipeConfirmProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLButtonElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);
  const [done, setDone] = useState(false); // ✓ ko'rsatish uchun
  const progressRef = useRef(0);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);

  const KNOB = 52;
  const maxTravel = () => Math.max(40, (trackRef.current?.clientWidth ?? 280) - KNOB - 8);

  const paint = (p: number) => {
    if (knobRef.current) knobRef.current.style.transform = `translateX(${(p * maxTravel()).toFixed(1)}px)`;
    if (fillRef.current) fillRef.current.style.width = `${(4 + p * 96).toFixed(1)}%`;
  };
  const setSnap = (on: boolean) => {
    if (knobRef.current) knobRef.current.style.transition = on ? 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none';
    if (fillRef.current) fillRef.current.style.transition = on ? 'width 160ms ease-out' : 'none';
  };

  useEffect(() => {
    paint(0);
    setSnap(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tashqi reset (busy → false)
  useEffect(() => {
    if (!busy) {
      progressRef.current = 0;
      setDone(false);
      setSnap(true);
      paint(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  const haptic = () => {
    try {
      (window as Window & { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred?: (s: string) => void } } } })
        .Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('heavy');
    } catch {/* */}
  };

  const onStart = (clientX: number) => {
    if (disabled || busy) return;
    draggingRef.current = true;
    startXRef.current = clientX;
    setSnap(false); // drag — transition O'CHIQ (instant)
  };
  const onMove = (clientX: number) => {
    if (!draggingRef.current) return;
    const p = Math.max(0, Math.min(1, (clientX - startXRef.current) / maxTravel()));
    progressRef.current = p;
    paint(p); // DOM — DARHOL, re-render yo'q
  };
  const onEnd = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setSnap(true);
    if (progressRef.current >= 0.85) {
      progressRef.current = 1;
      paint(1);
      setDone(true);
      haptic();
      onConfirm();
    } else {
      progressRef.current = 0;
      paint(0);
    }
  };

  const baseColor = tone === 'success' ? 'from-emerald-500 to-emerald-600' : 'from-[#c62020] to-[#f97316]';

  return (
    <div
      ref={trackRef}
      className={`relative h-[60px] w-full overflow-hidden rounded-2xl bg-white/10 backdrop-blur ${
        disabled ? 'opacity-40' : ''
      }`}
      style={{ touchAction: 'none' }}
    >
      {/* Progress fill — ref orqali */}
      <div
        ref={fillRef}
        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${baseColor}`}
        style={{ width: '4%', willChange: 'width' }}
      />
      {/* Label */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-black uppercase tracking-wider text-white">
        {busy ? <Loader2 size={20} className="animate-spin" /> : done ? '✓' : label}
      </div>
      {/* Knob — pozitsiya ref orqali */}
      <button
        ref={knobRef}
        type="button"
        disabled={disabled || busy}
        onPointerDown={(e) => {
          try { (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId); } catch {/* */}
          onStart(e.clientX);
        }}
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerUp={(e) => {
          try { (e.currentTarget as HTMLButtonElement).releasePointerCapture(e.pointerId); } catch {/* */}
          onEnd();
        }}
        onPointerCancel={onEnd}
        className="absolute left-1 top-1 flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-white text-slate-900 shadow-lg"
        style={{ willChange: 'transform' }}
        aria-label={label}
      >
        <ChevronsRight size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}
