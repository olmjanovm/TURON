import { OrderStatusEnum } from '@turon/shared';

/** Buyurtma holati uchun yorliq + rang (admin bo'ylab bir xil). */
export const STATUS_META: Record<string, { label: string; dot: string; chip: string }> = {
  [OrderStatusEnum.PENDING]: { label: 'Yangi', dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700' },
  [OrderStatusEnum.PREPARING]: { label: 'Tayyorlanmoqda', dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700' },
  [OrderStatusEnum.READY_FOR_PICKUP]: { label: 'Tayyor', dot: 'bg-indigo-500', chip: 'bg-indigo-50 text-indigo-700' },
  [OrderStatusEnum.DELIVERING]: { label: "Yo'lda", dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700' },
  [OrderStatusEnum.DELIVERED]: { label: 'Yetkazildi', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700' },
  [OrderStatusEnum.CANCELLED]: { label: 'Bekor', dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700' },
};

export function statusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-600' };
}

export function orderMoney(o: { total?: number; finalAmount?: number; totalAmount?: number }): number {
  return o.total ?? o.finalAmount ?? o.totalAmount ?? 0;
}

/** Holatni oldinga suradigan keyingi qadam (admin tugmasi uchun). */
export const NEXT_STATUS: Partial<Record<string, { next: OrderStatusEnum; label: string }>> = {
  [OrderStatusEnum.PENDING]: { next: OrderStatusEnum.PREPARING, label: 'Tayyorlashni boshlash' },
  [OrderStatusEnum.PREPARING]: { next: OrderStatusEnum.READY_FOR_PICKUP, label: 'Tayyor deb belgilash' },
  [OrderStatusEnum.READY_FOR_PICKUP]: { next: OrderStatusEnum.DELIVERING, label: "Yo'lga chiqarish" },
  [OrderStatusEnum.DELIVERING]: { next: OrderStatusEnum.DELIVERED, label: 'Yetkazildi deb belgilash' },
};
