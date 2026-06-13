'use client';

import { Check } from 'lucide-react';
import { STAGE_FLOW, getStageIndex, type DeliveryStage } from '@/hooks/use-courier';

export function StageTracker({ current }: { current: DeliveryStage | undefined }) {
  const idx = getStageIndex(current);

  return (
    <div className="flex items-start gap-1">
      {STAGE_FLOW.map((step, i) => {
        const done = i < idx;
        const active = i === idx && current !== 'DELIVERED';
        const allDone = current === 'DELIVERED';

        return (
          <div key={step.key} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              {i > 0 && (
                <div className={`-ml-1 h-0.5 flex-1 rounded-full ${done || allDone ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition-all ${
                  done || allDone
                    ? 'bg-emerald-500 text-white shadow-[0_4px_10px_-2px_rgba(16,185,129,0.5)]'
                    : active
                      ? 'bg-gradient-to-br from-[#c62020] to-[#f97316] text-white shadow-[0_4px_10px_-2px_rgba(198,32,32,0.5)] ring-4 ring-[#c62020]/15'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {done || allDone ? <Check size={13} strokeWidth={3} /> : i + 1}
              </div>
              {i < STAGE_FLOW.length - 1 && (
                <div className={`-mr-1 h-0.5 flex-1 rounded-full ${done || (allDone && i < STAGE_FLOW.length - 1) ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </div>
            <p
              className={`text-center text-[9px] font-bold leading-tight ${
                done || allDone ? 'text-emerald-600' : active ? 'text-[#c62020]' : 'text-slate-400'
              }`}
            >
              {step.short}
            </p>
          </div>
        );
      })}
    </div>
  );
}
