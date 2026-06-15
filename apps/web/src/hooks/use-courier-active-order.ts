'use client';

import { useMemo } from 'react';
import { useCourierOrders, type AssignmentStatus, type CourierOrderPreview } from '@/hooks/use-courier';

/**
 * "Faol buyurtma" ta'rifi — YAGONA manba.
 * Faol = kuryer hozir yetkazyapti: ACCEPTED | PICKED_UP | DELIVERING.
 * Bir nechta faol bo'lsa (kamdan-kam), eng oldinga ketganini tanlaymiz
 * (DELIVERING > PICKED_UP > ACCEPTED), teng bo'lsa eng yangi assignedAt.
 *
 * use-courier-gps va orders page ham shu mantiqdan foydalanishi mumkin (DRY).
 */
const ACTIVE_STATUSES: readonly AssignmentStatus[] = ['ACCEPTED', 'PICKED_UP', 'DELIVERING'];

const STAGE_RANK: Record<string, number> = {
  DELIVERING: 3,
  PICKED_UP: 2,
  ACCEPTED: 1,
};

export function useCourierActiveOrder(): CourierOrderPreview | null {
  const { data: orders } = useCourierOrders();

  return useMemo(() => {
    const active = (orders ?? []).filter((o) => {
      const s = o.courierAssignmentStatus;
      return s != null && ACTIVE_STATUSES.includes(s);
    });
    if (active.length === 0) return null;

    return active.slice().sort((a, b) => {
      const ra = STAGE_RANK[a.courierAssignmentStatus ?? ''] ?? 0;
      const rb = STAGE_RANK[b.courierAssignmentStatus ?? ''] ?? 0;
      if (rb !== ra) return rb - ra;
      const ta = a.assignedAt ? Date.parse(a.assignedAt) : 0;
      const tb = b.assignedAt ? Date.parse(b.assignedAt) : 0;
      return tb - ta;
    })[0];
  }, [orders]);
}
