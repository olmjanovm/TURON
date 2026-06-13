import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SelectedAddress {
  id: string;
  label: string;
  addressText: string;
  latitude?: number;
  longitude?: number;
}

interface PrefsState {
  selectedAddressId: string | null;
  selectedAddress: SelectedAddress | null;
  favorites: string[]; // product IDs
  recentSearches: string[];

  setSelectedAddress: (a: SelectedAddress | null) => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  pushRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
}

/**
 * Customer preferences — persisted offline-first.
 * Stores the chosen delivery address shortcut and product favorites.
 * The actual address records still live on the server (CRUD via API),
 * but we cache the *currently selected* one here for instant UI.
 */
export const useCustomerPrefs = create<PrefsState>()(
  persist(
    (set, get) => ({
      selectedAddressId: null,
      selectedAddress: null,
      favorites: [],
      recentSearches: [],

      setSelectedAddress: (a) =>
        set({ selectedAddressId: a?.id ?? null, selectedAddress: a }),

      toggleFavorite: (productId) =>
        set((s) => ({
          favorites: s.favorites.includes(productId)
            ? s.favorites.filter((id) => id !== productId)
            : [productId, ...s.favorites],
        })),

      isFavorite: (productId) => get().favorites.includes(productId),

      pushRecentSearch: (q) => {
        const trimmed = q.trim();
        if (trimmed.length < 2) return;
        set((s) => ({
          recentSearches: [trimmed, ...s.recentSearches.filter((x) => x !== trimmed)].slice(0, 8),
        }));
      },

      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    { name: 'turon-customer-prefs' },
  ),
);
