import { create } from 'zustand';
import type { CourierOrderPreview } from '@/hooks/use-courier';

/** Modal yopilgach shu muddatga qayta ko'rsatmaymiz (PENDING qolsa keyin yana). */
export const SNOOZE_MS = 45_000;

interface InterruptState {
  /** Hozirda ko'rsatilayotgan interrupt buyurtmasi (yoki null). */
  current: CourierOrderPreview | null;
  /**
   * orderId → millis (Date.now) shu vaqtgacha qayta ko'rsatmaymiz.
   * MUHIM: "doimiy seen" EMAS — vaqtinchalik "snooze". Buyurtma PENDING
   * (ASSIGNED) qolsa, snooze tugagach detektor uni QAYTA ko'rsatadi (C3-5
   * catch-up: kuryer birinchi marta ko'rmasa/ulgurmasa yo'qolib qolmasin).
   */
  snoozedUntil: Record<string, number>;

  showInterrupt: (order: CourierOrderPreview) => void;
  /** Modalni yashiradi (snooze qo'ymaydi — odatda boshqa joydan snooze keladi). */
  dismissInterrupt: () => void;
  /** Yashir + shu order'ni `ms` muddatga qayta ko'rsatmaslik. */
  snooze: (orderId: string, ms?: number) => void;
  isSnoozed: (orderId: string) => boolean;
  reset: () => void;
}

/**
 * Interrupt modali holati — faqat RAM (persist emas).
 * Sahifa refresh bo'lsa snooze tozalanadi (tabiiy — qayta ASSIGNED buyurtmalar
 * yana interrupt qiladi). Detector va modal komponent shu store'ni o'qiydi.
 */
export const useCourierInterrupt = create<InterruptState>((set, get) => ({
  current: null,
  snoozedUntil: {},

  showInterrupt: (order) => {
    const s = get();
    if (s.current?.id === order.id) return; // allaqachon ko'rsatilyapti
    const until = s.snoozedUntil[order.id];
    if (until && until > Date.now()) return; // snooze davom etyapti
    set({ current: order });
  },

  dismissInterrupt: () => set({ current: null }),

  snooze: (orderId, ms = SNOOZE_MS) =>
    set((s) => ({
      current: s.current?.id === orderId ? null : s.current,
      snoozedUntil: { ...s.snoozedUntil, [orderId]: Date.now() + ms },
    })),

  isSnoozed: (orderId) => {
    const until = get().snoozedUntil[orderId];
    return !!until && until > Date.now();
  },

  reset: () => set({ current: null, snoozedUntil: {} }),
}));
