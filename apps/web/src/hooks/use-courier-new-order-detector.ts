'use client';

import { useEffect, useRef, useState } from 'react';
import { useCourierOrders, useCourierStatus } from '@/hooks/use-courier';
import { useCourierInterrupt } from '@/stores/courier-interrupt-store';
import { useCourierSound } from '@/stores/courier-sound-store';
import { useCourierOrderSound } from '@/hooks/use-courier-order-sound';

const PENDING = 'ASSIGNED';
const ACTIVE = ['ACCEPTED', 'PICKED_UP', 'DELIVERING'];
/** Poll tick — react-query strukturaviy almashinish refni saqlasa ham qayta baholash. */
const RECHECK_MS = 12_000;

/**
 * Yangi (PENDING/ASSIGNED) buyurtmani aniqlaydi va interrupt modalni ko'rsatadi.
 *
 * C3-5 — "yangi buyurtma kelmaydi" tuzatishi:
 *  - **Catch-up:** birinchi yuklashda mavjud ASSIGNED'larni YUTMAYMIZ (eski kod
 *    ularni "seen" qilib tashlardi → app ochilishidan oldin biriktirilgan
 *    buyurtma hech qachon chiqmasdi). Endi PENDING bor bo'lsa darrov ko'rsatamiz.
 *  - **Qayta ko'rsatish:** modal yopilganda (timeout/dismiss) `snooze` qo'yiladi;
 *    buyurtma PENDING qolsa snooze tugagach QAYTA chiqadi. Faqat socketga
 *    tayanmaymiz — `useCourierOrders` 8s poll + bu yerda 12s tick.
 *  - **Faol topshiriqда** (ACCEPTED/PICKED_UP/DELIVERING) interrupt qilmaymiz.
 *  - Yangi ko'rsatilganda bir martalik tovush (toggle yoqilgan bo'lsa).
 */
export function useCourierNewOrderDetector() {
  const { data: orders = [] } = useCourierOrders();
  const { data: status } = useCourierStatus();
  const showInterrupt = useCourierInterrupt((s) => s.showInterrupt);
  const dismissInterrupt = useCourierInterrupt((s) => s.dismissInterrupt);
  const snoozedUntil = useCourierInterrupt((s) => s.snoozedUntil);
  const current = useCourierInterrupt((s) => s.current);

  const soundEnabled = useCourierSound((s) => s.enabled);
  const { play } = useCourierOrderSound();
  const lastBeepedRef = useRef<string | null>(null);

  // 12s tick — snooze tugagach qayta baholash (poll refi o'zgarmasa ham).
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), RECHECK_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const assigned = orders.filter((o) => o.courierAssignmentStatus === PENDING);
    const hasActive =
      orders.some((o) => ACTIVE.includes(o.courierAssignmentStatus ?? '')) ||
      ACTIVE.includes(status?.activeAssignment?.assignmentStatus ?? '');

    // Kuryer hozir buyurtma yetkazyapti — chalg'itmaymiz
    if (hasActive) {
      if (current) dismissInterrupt();
      return;
    }

    if (assigned.length === 0) {
      // ASSIGNED qolmadi (boshqa kuryer oldi / bekor qilindi) — modalni yop
      if (current) dismissInterrupt();
      lastBeepedRef.current = null;
      return;
    }

    // Snooze qilinmagan birinchi PENDING — catch-up + qayta ko'rsatish
    const now = Date.now();
    const pending = assigned.find((o) => {
      const until = snoozedUntil[o.id];
      return !(until && until > now);
    });

    if (pending) {
      if (current?.id !== pending.id) showInterrupt(pending);
      // Yangi ko'rsatilgan buyurtma uchun bir martalik tovush
      if (soundEnabled && lastBeepedRef.current !== pending.id) {
        lastBeepedRef.current = pending.id;
        play();
      }
    } else if (current) {
      // Hammasi snooze — ochiq modal bo'lsa yopamiz
      dismissInterrupt();
    }
  }, [orders, status, snoozedUntil, current, soundEnabled, showInterrupt, dismissInterrupt, play]);
}
