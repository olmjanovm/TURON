import { create } from 'zustand';

/**
 * Kuryer admin bilan chat OCHGAN buyurtmalar ro'yxati (orderId).
 * Maqsad: tarix ro'yxatida o'qilmagan admin javobini ko'rsatishda
 * FAQAT shu (kichik) to'plam uchun unread poll qilamiz — butun tarix
 * bo'yicha N+1 so'rov yubormaymiz. localStorage'da saqlanadi (refresh'dan keyin ham).
 */
const LS_KEY = 'courier:contacted-orders';
const MAX = 50;

function load(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function save(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ids.slice(-MAX)));
  } catch {
    /* kvota/private rejim — e'tiborsiz */
  }
}

interface ContactedState {
  /** Hydrate qilinganmi (SSR mosligi uchun boshlang'ich [] bo'ladi). */
  hydrated: boolean;
  ids: string[];
  hydrate: () => void;
  markContacted: (orderId: string) => void;
}

export const useContactedOrders = create<ContactedState>((set, get) => ({
  hydrated: false,
  ids: [],

  hydrate: () => {
    if (get().hydrated) return;
    set({ ids: load(), hydrated: true });
  },

  markContacted: (orderId) =>
    set((s) => {
      if (s.ids.includes(orderId)) return s;
      const next = [...s.ids, orderId];
      save(next);
      return { ids: next };
    }),
}));
