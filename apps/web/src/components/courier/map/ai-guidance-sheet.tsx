'use client';

import { useCallback, useState } from 'react';
import { Sparkles, X, Loader2, Volume2, RefreshCw } from 'lucide-react';
import { useAiGuidance, type AiGuidanceRequest } from '@/hooks/use-courier';
import type { RouteResult } from '@/lib/route-fetcher';
import { speak } from '@/lib/nav-audio';

interface Props {
  orderNumber?: string | number;
  stageLabel?: string;
  pickupLabel?: string;
  destinationLabel?: string;
  vehicleMode?: 'auto' | 'pedestrian' | 'bicycle';
  route: RouteResult | null;
}

/**
 * AI yo'l-yo'riq yordamchisi — FAB + pastki sheet.
 * Marshrut burilishlarini backend'ga yuboradi (bepul LLM: Gemini→Groq→mahalliy),
 * sodda o'zbekcha qadam-baqadam ko'rsatma qaytaradi. Ovozli o'qish ham bor.
 */
export function AiGuidanceSheet({
  orderNumber, stageLabel, pickupLabel, destinationLabel, vehicleMode, route,
}: Props) {
  const [open, setOpen] = useState(false);
  const ai = useAiGuidance();

  const ask = useCallback(() => {
    const body: AiGuidanceRequest = {
      orderNumber: orderNumber != null ? String(orderNumber) : undefined,
      stageLabel,
      pickupLabel,
      destinationLabel,
      vehicleMode,
      totalDistanceMeters: route?.totalDistanceMeters,
      totalDurationSec: route?.totalDurationSec,
      maneuvers: route?.maneuvers?.slice(0, 60).map((m) => ({
        type: m.type,
        instruction: m.instruction,
        distanceFromStartMeters: m.distanceFromStartMeters,
      })),
    };
    ai.mutate(body);
  }, [ai, orderNumber, stageLabel, pickupLabel, destinationLabel, vehicleMode, route]);

  const onOpen = useCallback(() => {
    setOpen(true);
    if (!ai.data) ask();
  }, [ai.data, ask]);

  const guidance = ai.data?.guidance ?? '';

  return (
    <>
      {/* FAB — chap markaz (voice o'ng markazda — simmetrik) */}
      <button
        type="button"
        onClick={onOpen}
        aria-label="AI yo'l-yo'riq"
        className="absolute left-3.5 top-1/2 z-[1000] flex h-[50px] w-[50px] -translate-y-1/2 flex-col items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[0_4px_18px_rgba(99,102,241,0.55)] active:scale-95"
      >
        <Sparkles size={20} />
        <span style={{ fontSize: 7, fontWeight: 800, lineHeight: 1, marginTop: 1 }}>AI</span>
      </button>

      {open && (
        <div className="absolute inset-0 z-[1100] flex items-end bg-black/55 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="max-h-[75%] w-full overflow-hidden rounded-t-3xl bg-[#16161a] shadow-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">AI yo&apos;l-yo&apos;riq</p>
                  {ai.data && (
                    <p className="text-[10px] text-white/40">
                      {ai.data.source === 'local' ? 'Oflayn (ORS)' : ai.data.source === 'gemini' ? 'Gemini' : 'Groq'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {guidance && (
                  <button
                    type="button"
                    onClick={() => speak(guidance, { key: `ai_${Date.now()}` })}
                    aria-label="Ovozli o'qish"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/90 text-white active:scale-95"
                  >
                    <Volume2 size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={ask}
                  disabled={ai.isPending}
                  aria-label="Qayta"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw size={15} className={ai.isPending ? 'animate-spin' : ''} />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Yopish"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white active:scale-95"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-4 py-4" style={{ maxHeight: 'calc(75vh - 56px)' }}>
              {ai.isPending && (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-white/60">
                  <Loader2 size={26} className="animate-spin text-violet-400" />
                  <p className="text-xs">Yo&apos;l-yo&apos;riq tayyorlanmoqda...</p>
                </div>
              )}
              {ai.isError && !ai.isPending && (
                <div className="py-8 text-center">
                  <p className="text-sm font-bold text-red-400">Yo&apos;l-yo&apos;riqni olishda xatolik</p>
                  <button
                    type="button"
                    onClick={ask}
                    className="mt-3 rounded-2xl bg-violet-500 px-5 py-2.5 text-sm font-black text-white active:scale-95"
                  >
                    Qayta urinish
                  </button>
                </div>
              )}
              {guidance && !ai.isPending && (
                <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-white/90">{guidance}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
