import { create } from 'zustand';

/**
 * "Yangi buyurtma tovushi" ON/OFF — localStorage'da saqlanadi (BE shart emas).
 * Default: YOQILGAN. Profil sahifasidan boshqariladi (C3-5).
 */
const LS_KEY = 'courier:new-order-sound';

function load(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw == null ? true : raw === '1';
  } catch {
    return true;
  }
}

function save(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, enabled ? '1' : '0');
  } catch {
    /* kvota / private rejim — e'tiborsiz */
  }
}

interface SoundState {
  /** SSR mosligi uchun boshlang'ich `true`, hydrate'dan keyin localStorage. */
  hydrated: boolean;
  enabled: boolean;
  hydrate: () => void;
  setEnabled: (v: boolean) => void;
  toggle: () => void;
}

export const useCourierSound = create<SoundState>((set, get) => ({
  hydrated: false,
  enabled: true,

  hydrate: () => {
    if (get().hydrated) return;
    set({ enabled: load(), hydrated: true });
  },

  setEnabled: (v) => {
    save(v);
    set({ enabled: v });
  },

  toggle: () => {
    const next = !get().enabled;
    save(next);
    set({ enabled: next });
  },
}));
