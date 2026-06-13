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
 * Swipe-to-confirm button — kuryer aniqlik bilan harakat tasdiqlashi uchun.
 * O'ngga sudrash → progress to'ladi → 85%+ release → confirm.
 * Tasodifiy bosishni oldini oladi (Wolt/Uber Driver kabi).
 */
export function SwipeConfirm({ label, onConfirm, busy, disabled, tone = 'primary' }: SwipeConfirmProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0); // 0..1
  const draggingRef = useRef(false);
  const startXRef = useRef(0);

  useEffect(() => {
    if (!busy && progress === 1) {
      // Confirm fired — keep visual full until busy resets externally
    }
  }, [busy, progress]);

  const trackWidth = () => trackRef.current?.clientWidth ?? 280;
  const knobSize = 52;
  const maxTravel = () => Math.max(40, trackWidth() - knobSize - 8);

  const onStart = (clientX: number) => {
    if (disabled || busy) return;
    draggingRef.current = true;
    startXRef.current = clientX;
  };
  const onMove = (clientX: number) => {
    if (!draggingRef.current) return;
    const dx = clientX - startXRef.current;
    const p = Math.max(0, Math.min(1, dx / maxTravel()));
    setProgress(p);
  };
  const onEnd = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (progress >= 0.85) {
      setProgress(1);
      try {
        const tg = (window as Window & { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred?: (s: string) => void } } } })
          .Telegram?.WebApp?.HapticFeedback;
        tg?.impactOccurred?.('heavy');
      } catch {/* ignore */}
      onConfirm();
    } else {
      setProgress(0);
    }
  };

  // Reset on external reset (busy → false)
  useEffect(() => {
    if (!busy) setProgress(0);
  }, [busy]);

  const baseColor =
    tone === 'success'
      ? 'from-emerald-500 to-emerald-600'
      : 'from-[#c62020] to-[#f97316]';

  return (
    <div
      ref={trackRef}
      className={`relative h-[60px] w-full overflow-hidden rounded-2xl bg-white/10 backdrop-blur ${
        disabled ? 'opacity-40' : ''
      }`}
    >
      {/* Progress fill */}
      <div
        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${baseColor} transition-[width] duration-150 ease-out`}
        style={{ width: `${4 + progress * 96}%` }}
      />
      {/* Label */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-black uppercase tracking-wider text-white">
        {busy ? <Loader2 size={20} className="animate-spin" /> : progress === 1 ? '✓' : label}
      </div>
      {/* Knob */}
      <button
        type="button"
        disabled={disabled || busy}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
          onStart(e.clientX);
        }}
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerUp={(e) => {
          try {
            (e.currentTarget as HTMLButtonElement).releasePointerCapture(e.pointerId);
          } catch {/* ignore */}
          onEnd();
        }}
        onPointerCancel={onEnd}
        className="absolute left-1 top-1 flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-white text-slate-900 shadow-lg active:scale-95"
        style={{
          transform: `translateX(${progress * maxTravel()}px)`,
          transition: draggingRef.current ? 'none' : 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        aria-label={label}
      >
        <ChevronsRight size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}
