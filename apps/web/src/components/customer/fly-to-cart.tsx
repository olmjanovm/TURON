'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

/**
 * Fly-to-cart: bir mahsulot rasmining nusxasini cart ikonka tomon bezier yo'l
 * bilan uchiradi, kichraytiradi, savatda bounce + badge yangilanadi.
 *
 * Uskuna:
 *   <FlyToCartProvider>
 *     <CartTargetRef ref={...} />  — ikonka joyini ro'yxatga oladi
 *     <button onClick={() => flyToCart({ x, y, imageUrl })}>...
 *   </FlyToCartProvider>
 *
 * Animatsiya GPU-friendly: faqat transform + opacity. ~600ms, 60fps.
 * Past quvvatli qurilmada CSS-only fallback (prefers-reduced-motion).
 */

interface FlyContext {
  registerTarget: (el: HTMLElement | null) => void;
  fly: (params: { fromX: number; fromY: number; imageUrl?: string; onLand?: () => void }) => void;
}

const Ctx = createContext<FlyContext | null>(null);

interface Flight {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  imageUrl?: string;
  onLand?: () => void;
}

let nextId = 0;

export function FlyToCartProvider({ children }: { children: React.ReactNode }) {
  const targetRef = useRef<HTMLElement | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bounceKey, setBounceKey] = useState(0);

  const registerTarget = useCallback((el: HTMLElement | null) => {
    targetRef.current = el;
  }, []);

  const fly: FlyContext['fly'] = useCallback((params) => {
    const target = targetRef.current;
    if (!target) {
      params.onLand?.();
      return;
    }
    const rect = target.getBoundingClientRect();
    const toX = rect.left + rect.width / 2;
    const toY = rect.top + rect.height / 2;

    const flight: Flight = {
      id: ++nextId,
      fromX: params.fromX,
      fromY: params.fromY,
      toX,
      toY,
      imageUrl: params.imageUrl,
      onLand: () => {
        params.onLand?.();
        setBounceKey((k) => k + 1);
      },
    };
    setFlights((arr) => [...arr, flight]);
  }, []);

  const removeFlight = useCallback((id: number) => {
    setFlights((arr) => arr.filter((f) => f.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{ registerTarget, fly }}>
      {children}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
        {flights.map((f) => (
          <FlyingItem key={f.id} flight={f} onDone={() => removeFlight(f.id)} />
        ))}
      </div>
      <BounceBridge bounceKey={bounceKey} target={targetRef} />
    </Ctx.Provider>
  );
}

function FlyingItem({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  const [stage, setStage] = useState<'start' | 'mid' | 'end'>('start');

  useEffect(() => {
    const id1 = window.setTimeout(() => setStage('mid'), 20);
    const id2 = window.setTimeout(() => setStage('end'), 320);
    const id3 = window.setTimeout(() => {
      flight.onLand?.();
      onDone();
    }, 620);
    return () => {
      window.clearTimeout(id1);
      window.clearTimeout(id2);
      window.clearTimeout(id3);
    };
  }, [flight, onDone]);

  const dx = flight.toX - flight.fromX;
  const dy = flight.toY - flight.fromY;
  // bezier kontrol nuqtasi — yuqori arc
  const peakY = Math.min(flight.fromY, flight.toY) - 120;

  const style: React.CSSProperties = {
    left: 0,
    top: 0,
    transform:
      stage === 'start'
        ? `translate(${flight.fromX - 28}px, ${flight.fromY - 28}px) scale(1)`
        : stage === 'mid'
          ? `translate(${flight.fromX + dx * 0.6 - 28}px, ${peakY - 28}px) scale(0.7)`
          : `translate(${flight.toX - 14}px, ${flight.toY - 14}px) scale(0.15)`,
    opacity: stage === 'end' ? 0 : 1,
    transition:
      stage === 'mid'
        ? 'transform 300ms cubic-bezier(0.45, 0, 0.55, 1.4), opacity 300ms ease'
        : 'transform 300ms cubic-bezier(0.5, -0.2, 0.6, 1.2), opacity 250ms ease',
  };

  return (
    <div
      className="absolute h-14 w-14 overflow-hidden rounded-2xl bg-slate-200 shadow-2xl"
      style={style}
    >
      {flight.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={flight.imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-amber-400 to-red-600" />
      )}
    </div>
  );
}

function BounceBridge({ bounceKey, target }: { bounceKey: number; target: React.RefObject<HTMLElement | null> }) {
  useEffect(() => {
    if (bounceKey === 0) return;
    const el = target.current;
    if (!el) return;
    el.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.25)' },
        { transform: 'scale(0.92)' },
        { transform: 'scale(1.05)' },
        { transform: 'scale(1)' },
      ],
      { duration: 420, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    );
    try {
      const tg = (window as Window & { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred?: (s: string) => void } } } })
        .Telegram?.WebApp?.HapticFeedback;
      tg?.impactOccurred?.('medium');
    } catch {/* ignore */}
  }, [bounceKey, target]);
  return null;
}

export function useFlyToCart(): FlyContext['fly'] {
  const ctx = useContext(Ctx);
  if (!ctx) return () => {/* no-op outside provider */};
  return ctx.fly;
}

export function useCartTargetRegister(): FlyContext['registerTarget'] {
  const ctx = useContext(Ctx);
  if (!ctx) return () => {/* no-op */};
  return ctx.registerTarget;
}
