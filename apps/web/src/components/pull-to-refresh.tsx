'use client';

import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';

/**
 * iPhone-style PTR indikator + global gesture listener.
 * Layout darajasida bir marta mount qilinadi.
 * 12 ta tick aylanada, mavjud ekran tepasiga sudralganda paydo bo'ladi.
 */
export function PullToRefresh() {
  const { pullDistance, refreshing, triggerThreshold } = usePullToRefresh();

  // Progress 0..1 — knob aylanish va opacity uchun
  const progress = Math.min(1, pullDistance / triggerThreshold);
  const visible = pullDistance > 4 || refreshing;

  // Spinner aylanishi: pull paytida progress'ga bog'liq, refresh paytida CSS animatsiya
  const rotation = refreshing ? 0 : progress * 360;

  // Tushunarli matn: torting → qo'yib yuboring → yangilanmoqda
  const label = refreshing
    ? 'Yangilanmoqda…'
    : progress >= 1
      ? 'Qo‘yib yuboring'
      : 'Yangilash uchun torting';

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[55] mx-auto flex w-full max-w-[480px] justify-center"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        transform: `translateY(${refreshing ? triggerThreshold : pullDistance}px)`,
        transition: refreshing || pullDistance === 0 ? 'transform 240ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        opacity: visible ? 1 : 0,
        willChange: 'transform, opacity',
      }}
    >
      <div className="-mt-12 flex flex-col items-center gap-1.5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_8px_20px_-4px_rgba(15,23,42,0.25)] dark:bg-slate-900 dark:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.55)]"
          style={{
            transform: `rotate(${rotation}deg) scale(${0.7 + progress * 0.3})`,
            transition: refreshing ? 'transform 220ms ease-out' : 'none',
          }}
        >
          <IPhoneSpinner spinning={refreshing} progress={progress} />
        </div>
        <span
          className="whitespace-nowrap rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 shadow-sm dark:bg-slate-900/95 dark:text-slate-300"
          style={{ opacity: refreshing || progress > 0.1 ? 1 : 0, transition: 'opacity 150ms' }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

/**
 * Klassik iOS spinner — 12 ta segment aylanada, har biri ketma-ket so'nadi.
 * Refresh paytida 0.85s'da aylanadi. Pull paytida progress'ga qarab segmentlar yonadi.
 */
function IPhoneSpinner({ spinning, progress }: { spinning: boolean; progress: number }) {
  const COUNT = 12;
  const ticks = Array.from({ length: COUNT });
  return (
    <div className="relative h-5 w-5">
      {ticks.map((_, i) => {
        // Pull paytida: segmentlar progress'ga qarab navbat bilan paydo bo'ladi
        const segmentProgress = progress * COUNT;
        const litStatic = i < segmentProgress ? 1 : 0.15;
        return (
          <span
            key={i}
            className="ios-tick absolute left-1/2 top-0 block origin-bottom rounded-full bg-slate-700 dark:bg-slate-100"
            style={{
              width: 1.6,
              height: 5,
              transform: `translateX(-50%) rotate(${i * (360 / COUNT)}deg) translateY(-7px)`,
              opacity: spinning ? undefined : litStatic,
              animation: spinning ? `ios-tick-fade 0.9s linear infinite` : undefined,
              animationDelay: spinning ? `${-(i * 0.9) / COUNT}s` : undefined,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes ios-tick-fade {
          0% { opacity: 1; }
          100% { opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}
