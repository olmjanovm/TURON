import { create } from 'zustand';
import type { CourierOrderPreview } from '@/hooks/use-courier';

interface InterruptState {
  /** Hozirda ko'rsatilayotgan interrupt buyurtmasi (yoki null). */
  current: CourierOrderPreview | null;
  /** Bir marta ko'rsatilgan buyurtmalar — qayta interrupt qilmaslik uchun. */
  seenIds: Set<string>;
  /** Detector init bo'ldimi? (Birinchi yuklashda mavjud buyurtmalar pop qilmasin.) */
  initialized: boolean;

  showInterrupt: (order: CourierOrderPreview) => void;
  dismissInterrupt: () => void;
  markSeen: (orderId: string) => void;
  setInitialized: () => void;
  reset: () => void;
}

/**
 * Interrupt modali holati — faqat ram (persist emas).
 * Sahifa refresh bo'lsa seenIds tozalanadi (tabiiy — qayta ASSIGNED buyurtmalar
 * yana interrupt qiladi). Detector va modal komponent shu store'ni o'qiydi.
 */
export const useCourierInterrupt = create<InterruptState>((set, get) => ({
  current: null,
  seenIds: new Set<string>(),
  initialized: false,

  showInterrupt: (order) => {
    if (get().seenIds.has(order.id)) return;
    set({ current: order });
  },

  dismissInterrupt: () => set({ current: null }),

  markSeen: (orderId) =>
    set((s) => {
      if (s.seenIds.has(orderId)) return s;
      const next = new Set(s.seenIds);
      next.add(orderId);
      return { seenIds: next };
    }),

  setInitialized: () => set({ initialized: true }),

  reset: () => set({ current: null, seenIds: new Set(), initialized: false }),
}));
