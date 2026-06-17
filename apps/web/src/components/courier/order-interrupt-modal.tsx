'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AlertCircle, MapPin, Package } from 'lucide-react';
import { useCourierInterrupt } from '@/stores/courier-interrupt-store';
import { useAcceptOrder, useDeclineOrder } from '@/hooks/use-courier';
import { DualSwipe } from './dual-swipe';

/**
 * Yangi buyurtma interrupt sheet:
 * - Normal sahifalar: 35% balandlik, 25s timer
 * - Xaritada (/courier/map/*): 20% balandlik, 15s timer
 * - O'ng swipe → qabul → /courier/map/[id] (navigation darhol boshlanadi)
 * - Chap swipe → rad → dismiss
 * - Backend xato bo'lsa user ko'radi (silent fail emas)
 * - Timeout: seen deb belgilanadi (qayta interrupt qilmaydi, ASSIGNED qoladi)
 */
export function OrderInterruptModal() {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const current = useCourierInterrupt((s) => s.current);
  const snooze = useCourierInterrupt((s) => s.snooze);
  const accept = useAcceptOrder();
  const decline = useDeclineOrder();
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const onMap = pathname.startsWith('/courier/map');
  const totalSec = onMap ? 15 : 25;
  const heightPct = onMap ? 20 : 35;

  useEffect(() => {
    setError(null);
  }, [current?.id]);

  useEffect(() => {
    if (!current) return;
    try {
      const tg = (window as Window & { Telegram?: { WebApp?: { HapticFeedback?: { notificationOccurred?: (s: string) => void } } } })
        .Telegram?.WebApp?.HapticFeedback;
      tg?.notificationOccurred?.('warning');
    } catch {/* ignore */}
  }, [current?.id]);

  useEffect(() => {
    if (!current) {
      startedAtRef.current = null;
      setTimeLeft(0);
      return;
    }
    startedAtRef.current = Date.now();
    setTimeLeft(totalSec);

    const intervalId = window.setInterval(() => {
      if (startedAtRef.current == null) return;
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      const remaining = Math.max(0, totalSec - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        // Timeout — vaqtinchalik snooze; PENDING qolsa keyin yana chiqadi (C3-5)
        snooze(current.id);
      }
    }, 200);

    return () => window.clearInterval(intervalId);
  }, [current?.id, totalSec, snooze]);

  if (!current) return null;

  const handleAccept = () => {
    setError(null);
    accept.mutate(current.id, {
      onSuccess: () => {
        // Qabul qilindi — uzoq snooze (qayta pop bo'lmasin; baribir ACTIVE bo'ladi)
        snooze(current.id, 5 * 60_000);
        // Qabul qilingach DARHOL xarita navigation boshlanadi
        router.push(`/courier/map/${current.id}`);
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : "Qabul qilib bo'lmadi. Qayta urinib ko'ring.");
      },
    });
  };

  const handleDecline = () => {
    setError(null);
    decline.mutate(current.id, {
      onSuccess: () => {
        // Rad etildi — uzoq snooze (qayta pop bo'lmasin)
        snooze(current.id, 5 * 60_000);
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : "Rad etib bo'lmadi. Qayta urinib ko'ring.");
      },
    });
  };

  const total = (current.total ?? 0) + (current.deliveryFee ?? 0);
  const address = current.customerAddress?.addressText ?? current.deliveryAddress ?? current.destinationAddress;
  const progressPct = (timeLeft / totalSec) * 100;
  const busy = accept.isPending || decline.isPending;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {!onMap && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity" />
      )}

      <div
        className="pointer-events-auto absolute inset-x-0 bottom-0 mx-auto w-full max-w-[480px] rounded-t-3xl bg-white shadow-[0_-20px_50px_-8px_rgba(0,0,0,0.35)] dark:bg-slate-900"
        style={{
          height: `${heightPct}vh`,
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
        }}
      >
        <div className="h-1 w-full overflow-hidden rounded-t-3xl bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-[#c62020] transition-[width] duration-200 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex h-[calc(100%-4px)] flex-col px-4 pt-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-white shadow-[0_8px_18px_-6px_rgba(198,32,32,0.55)]">
                <Package size={18} strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#c62020]">
                  Yangi buyurtma
                </p>
                <p className="text-base font-black leading-tight text-slate-900 dark:text-slate-50">
                  #{current.orderNumber}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-black text-slate-900 tabular-nums dark:text-slate-50">
                {total.toLocaleString('uz-UZ')}
              </p>
              <p className="text-[10px] text-slate-400">so&apos;m · {Math.ceil(timeLeft)}s</p>
            </div>
          </div>

          {!onMap && address && (
            <div className="mt-3 flex items-start gap-1.5">
              <MapPin size={12} className="mt-0.5 shrink-0 text-slate-400" />
              <p className="line-clamp-2 text-xs leading-snug text-slate-600 dark:text-slate-300">
                {address}
              </p>
            </div>
          )}

          {!onMap && current.customerName && (
            <p className="mt-1 text-xs font-medium text-slate-500">{current.customerName}</p>
          )}

          {error && (
            <div className="mt-2 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 dark:bg-red-500/15">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs font-bold text-red-600 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="mt-auto pb-2">
            <DualSwipe
              acceptLabel="Qabul qilaman"
              declineLabel="Rad etish"
              busy={busy}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
            <p className="mt-1.5 text-center text-[10px] font-medium text-slate-400">
              {busy ? 'Yuborilmoqda...' : "Chapga sursang rad · O'ngga sursang qabul"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
