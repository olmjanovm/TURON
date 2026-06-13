'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

/**
 * Modern add-to-cart effect (Wolt/Glovo stili — "genie-jar" emas):
 *   1. Click joyidan ember "+1" badge yuqoriga ko'tariladi va kichik ark bilan
 *      cart FAB tomonga uchadi (~500ms, faqat transform + opacity → GPU).
 *   2. Cart FAB spring bounce (1 → 1.18 → 0.94 → 1.05 → 1, ~420ms).
 *   3. Telegram haptic medium.
 *
 * Provider birga ikkita context taqdim etadi:
 *   - registerTarget — cart FAB ro'yxatdan o'tkazadi (bir nechta DOM elementi
 *     ham mumkin, eng oxirgi mount g'olib bo'ladi).
 *   - fly(...) — animatsiyani triggerlash.
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
  onLand?: () => void;
}

let nextId = 0;

export function FlyToCartProvider({ children }: { children: React.ReactNode }) {
  const targetRef = useRef<HTMLElement | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bounceTick, setBounceTick] = useState(0);

  const registerTarget = useCallback((el: HTMLElement | null) => {
    targetRef.current = el;
  }, []);

  const fly: FlyContext['fly'] = useCallback((params) => {
    const target = targetRef.current;
    // Cart FAB hali ko'rinmasa (savat bo'sh edi) — qo'shgandan keyin mount bo'ladi.
    // Animatsiyani ekran o'ng-pastiga yo'naltirib oddiy emit bilan chiqaramiz.
    const rect = target?.getBoundingClientRect();
    const toX = rect ? rect.left + rect.width / 2 : window.innerWidth - 44;
    const toY = rect ? rect.top + rect.height / 2 : window.innerHeight - 130;

    const flight: Flight = {
      id: ++nextId,
      fromX: params.fromX,
      fromY: params.fromY,
      toX,
      toY,
      onLand: () => {
        params.onLand?.();
        setBounceTick((k) => k + 1);
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
      {/* Flight layer — pointer-events: none, juda yuqori z-index */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[70]">
        {flights.map((f) => (
          <FloatingBadge key={f.id} flight={f} onDone={() => removeFlight(f.id)} />
        ))}
      </div>
      <CartBouncer tick={bounceTick} target={targetRef} />
    </Ctx.Provider>
  );
}

function FloatingBadge({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  const [stage, setStage] = useState<'enter' | 'travel' | 'land'>('enter');

  useEffect(() => {
    // 0 → enter (badge paydo bo'ladi, +scale)
    const id1 = window.setTimeout(() => setStage('travel'), 60);
    // travel (arc bilan FAB tomonga uchadi)
    const id2 = window.setTimeout(() => setStage('land'), 380);
    // land (yo'q bo'ladi, callback)
    const id3 = window.setTimeout(() => {
      flight.onLand?.();
      onDone();
    }, 540);
    return () => {
      window.clearTimeout(id1);
      window.clearTimeout(id2);
      window.clearTimeout(id3);
    };
  }, [flight, onDone]);

  const dx = flight.toX - flight.fromX;
  const dy = flight.toY - flight.fromY;
  // Arc peak — yuqoriroq, harakat tabiiy bo'lishi uchun
  const peakY = Math.min(flight.fromY, flight.toY) - 80;

  let transform = '';
  let opacity = 1;
  let transition = '';

  if (stage === 'enter') {
    // Click joyida paydo bo'ladi, kichik pop
    transform = `translate(${flight.fromX - 22}px, ${flight.fromY - 22}px) scale(0.5)`;
    opacity = 0;
    transition = 'transform 60ms ease-out, opacity 60ms ease-out';
  } else if (stage === 'travel') {
    // Arc peak'ga, biroz aylanish
    transform = `translate(${flight.fromX + dx * 0.55 - 22}px, ${peakY - 22}px) scale(1) rotate(-12deg)`;
    opacity = 1;
    transition = 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1), opacity 320ms ease';
  } else {
    // FAB ichida yo'qoladi
    transform = `translate(${flight.toX - 12}px, ${flight.toY - 12}px) scale(0.2) rotate(0deg)`;
    opacity = 0;
    transition = 'transform 160ms cubic-bezier(0.4, 0, 1, 1), opacity 160ms ease';
  }

  return (
    <div
      className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#c62020] to-[#f97316] text-sm font-black text-white shadow-[0_8px_20px_-4px_rgba(198,32,32,0.6)] ring-2 ring-white"
      style={{ transform, opacity, transition, willChange: 'transform, opacity' }}
    >
      +1
    </div>
  );
}

function CartBouncer({ tick, target }: { tick: number; target: React.RefObject<HTMLElement | null> }) {
  useEffect(() => {
    if (tick === 0) return;
    const el = target.current;
    if (!el) return;
    // Spring bounce
    el.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.18)' },
        { transform: 'scale(0.94)' },
        { transform: 'scale(1.05)' },
        { transform: 'scale(1)' },
      ],
      { duration: 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    );
    try {
      const tg = (window as Window & { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred?: (s: string) => void } } } })
        .Telegram?.WebApp?.HapticFeedback;
      tg?.impactOccurred?.('medium');
    } catch {/* ignore */}
  }, [tick, target]);
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
