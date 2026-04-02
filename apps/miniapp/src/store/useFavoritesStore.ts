import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  favoriteProductIds: string[];
  favoriteStoreIds: string[];
  favoriteCategoryIds: string[];
  toggleProductFavorite: (productId: string) => void;
  toggleStoreFavorite: (storeId: string) => void;
  toggleCategoryFavorite: (categoryId: string) => void;
  isProductFavorite: (productId: string) => boolean;
  isStoreFavorite: (storeId: string) => boolean;
  isCategoryFavorite: (categoryId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteProductIds: [],
      favoriteStoreIds: [],
      favoriteCategoryIds: [],

      toggleProductFavorite: (productId) =>
        set((state) => ({
          favoriteProductIds: state.favoriteProductIds.includes(productId)
            ? state.favoriteProductIds.filter((id) => id !== productId)
            : [...state.favoriteProductIds, productId],
        })),

      toggleStoreFavorite: (storeId) =>
        set((state) => ({
          favoriteStoreIds: state.favoriteStoreIds.includes(storeId)
            ? state.favoriteStoreIds.filter((id) => id !== storeId)
            : [...state.favoriteStoreIds, storeId],
        })),

      toggleCategoryFavorite: (categoryId) =>
        set((state) => ({
          favoriteCategoryIds: state.favoriteCategoryIds.includes(categoryId)
            ? state.favoriteCategoryIds.filter((id) => id !== categoryId)
            : [...state.favoriteCategoryIds, categoryId],
        })),

      isProductFavorite: (productId) => get().favoriteProductIds.includes(productId),
      isStoreFavorite: (storeId) => get().favoriteStoreIds.includes(storeId),
      isCategoryFavorite: (categoryId) => get().favoriteCategoryIds.includes(categoryId),
    }),
    {
      name: 'turon-favorites-storage',
    },
  ),
);
