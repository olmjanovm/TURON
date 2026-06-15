'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navigation } from 'lucide-react';
import { useCourierActiveOrder } from '@/hooks/use-courier-active-order';
import { STAGE_FLOW, getStageIndex } from '@/hooks/use-courier';
import { useKeyboard } from '@/hooks/use-keyboard';
import { SwipeConfirm } from '@/components/courier/map/swipe-confirm';

/**
 * Doimiy "faol yetkazish" banneri — CourierLayout ichida global mount.
 * Kuryer istalgan sahifada faol topshirig'i bo'lsa, SLIDE-to-resume bilan
 * to'g'ridan xaritaga (navigatsiyaga) qaytadi (foydalanuvchi "slider" so'ragan).
 *
 * Yashirinadi: faol buyurtma yo'q · klaviatura ochiq · allaqachon xaritada ·
 * o'sha buyurtmaning detal sahifasida (takror bo'lmasin).
 */
export function ActiveDeliveryBar() {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const { isOpen: kbOpen } = useKeyboard();
  const active = useCourierActiveOrder();

  // Slide-up kirish animatsiyasi (mount'da pastdan ko'tariladi)
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (active) {
      const id = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
  }, [active]);

  if (!active || kbOpen) return null;
  if (pathname.startsWith('/courier/map/')) return null;
  if (pathname === `/courier/order/${active.id}`) return null;

  const stage = active.deliveryStage ?? 'IDLE';
  const stageText = STAGE_FLOW[getStageIndex(stage)]?.title ?? 'Yetkazilmoqda';
  const address = active.customerAddress?.addressText ?? active.deliveryAddress ?? null;

  return (
    <div
      className="fixed left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 px-3"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}
    >
      <div
        className="rounded-2xl border border-emerald-400/30 bg-slate-900/95 p-2.5 shadow-[0_14px_34px_-10px_rgba(16,185,129,0.55)] backdrop-blur transition-all duration-300 ease-out"
        style={{
          transform: shown ? 'translateY(0)' : 'translateY(12px)',
          opacity: shown ? 1 : 0,
        }}
      >
        {/* Info qatori */}
        <div className="mb-2 flex items-center gap-2.5 px-0.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
            <Navigation size={16} className="text-emerald-300" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-400" />
              <span className="truncate text-[10px] font-bold uppercase tracking-wider text-emerald-300/90">
                Faol yetkazish · {stageText}
              </span>
            </span>
            <span className="block truncate text-sm font-black text-white">
              #{active.orderNumber}
              {address ? ` · ${address}` : ''}
            </span>
          </span>
        </div>

        {/* Slide-to-resume — tasodifiy bosishni oldini oladi, "surib o'tish" hissi */}
        <SwipeConfirm
          label="Davom ettirish"
          tone="success"
          onConfirm={() => router.push(`/courier/map/${active.id}`)}
        />
      </div>
    </div>
  );
}
