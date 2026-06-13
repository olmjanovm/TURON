'use client';

import { useEffect, useRef } from 'react';
import { useCourierOrders, useCourierStatus } from '@/hooks/use-courier';
import { useCourierInterrupt } from '@/stores/courier-interrupt-store';

/**
 * Yangi ASSIGNED buyurtma kelishini aniqlaydi.
 * - Birinchi yuklash: mavjud ASSIGNED buyurtmalar "seen" deb belgilanadi (eski
 *   buyurtma birdan modal qilib chiqmasin).
 * - Keyin: agar kuryer hali faol topshiriqda bo'lsa (ACCEPTED/PICKED_UP/DELIVERING)
 *   yangi ASSIGNED'lar interrupt qilmaydi (chalg'itish yo'q).
 * - Aks holda: birinchi seen bo'lmagan ASSIGNED → modal.
 */
export function useCourierNewOrderDetector() {
  const { data: orders = [] } = useCourierOrders();
  const { data: status } = useCourierStatus();
  const showInterrupt = useCourierInterrupt((s) => s.showInterrupt);
  const dismissInterrupt = useCourierInterrupt((s) => s.dismissInterrupt);
  const markSeen = useCourierInterrupt((s) => s.markSeen);
  const setInitialized = useCourierInterrupt((s) => s.setInitialized);
  const initialized = useCourierInterrupt((s) => s.initialized);
  const seenIds = useCourierInterrupt((s) => s.seenIds);
  const initRef = useRef(initialized);

  useEffect(() => {
    const assigned = orders.filter((o) => o.courierAssignmentStatus === 'ASSIGNED');
    const hasActive =
      orders.some((o) =>
        ['ACCEPTED', 'PICKED_UP', 'DELIVERING'].includes(o.courierAssignmentStatus ?? ''),
      ) ||
      ['ACCEPTED', 'PICKED_UP', 'DELIVERING'].includes(
        status?.activeAssignment?.assignmentStatus ?? '',
      );

    // Kuryer hozir buyurtma yetkazyapti — chalg'itmaymiz
    if (hasActive) {
      assigned.forEach((o) => markSeen(o.id));
      dismissInterrupt();
      return;
    }

    // Birinchi yuklashda mavjud ASSIGNED'larni seen qilamiz
    if (!initRef.current) {
      assigned.forEach((o) => markSeen(o.id));
      setInitialized();
      initRef.current = true;
      return;
    }

    // Yangi (seen bo'lmagan) topshiriq
    const fresh = assigned.find((o) => !seenIds.has(o.id));
    if (fresh) showInterrupt(fresh);
  }, [orders, status, seenIds, markSeen, dismissInterrupt, showInterrupt, setInitialized]);
}
