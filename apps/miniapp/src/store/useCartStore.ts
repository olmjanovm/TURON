import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProductAvailabilityEnum, PromoDiscountTypeEnum } from '@turon/shared';
import type { AppliedPromo, CartItem, ProductSnapshot } from '../data/types';
import type { MenuProduct } from '../features/menu/types';
import { playSound } from '../utils/soundEffects';
import { useToastStore } from './useToastStore';

function calculatePromoDiscount(appliedPromo: AppliedPromo | null, subtotal: number) {
  if (!appliedPromo || subtotal < appliedPromo.minOrderValue) {
    return 0;
  }

  const rawDiscount =
    appliedPromo.discountType === PromoDiscountTypeEnum.PERCENTAGE
      ? (subtotal * appliedPromo.discountValue) / 100
      : appliedPromo.discountValue;

  return Math.max(0, Math.min(subtotal, Math.round(rawDiscount * 100) / 100));
}

interface CartState {
  items: CartItem[];
  appliedPromo: AppliedPromo | null;
  addToCart: (product: ProductSnapshot, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  setPromo: (promo: AppliedPromo | null) => void;
  setItems: (items: CartItem[]) => void;
  syncWithProducts: (products: MenuProduct[]) => void;

  // Computed (helper style instead of actual derived state for simple skeletons)
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotalItems: () => number;
  getFinalTotal: (deliveryFee: number) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedPromo: null,

      addToCart: (product, quantity = 1) => {
        const { items } = get();
        const cartItemId = product.menuItemId || product.id;
        const existingItem = items.find((item) => item.id === cartItemId);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.id === cartItemId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                ...product,
                id: cartItemId,
                menuItemId: product.menuItemId || product.id,
                isAvailable: product.isAvailable ?? true,
                quantity,
              },
            ],
          });
        }

        // Play sound effect
        playSound.addToCart();

        // Haptic feedback
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        }

        // Show toast notification
        try {
          const productName = product.name || 'Mahsulot';
          useToastStore.getState().addToast(
            `"${productName}" savatga qo'shildi`,
            'success',
            2000
          );
        } catch (e) {
          console.debug('Toast notification not available');
        }
      },

      removeFromCart: (productId) => {
        set({ items: get().items.filter((item) => item.id !== productId) });
      },

      updateQuantity: (productId, delta) => {
        const { items } = get();
        const newItems = items.map((item) => {
          if (item.id === productId) {
            const newQty = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQty };
          }
          return item;
        }).filter(item => item.quantity > 0);

        set({ items: newItems });

        // Haptic feedback
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }

        // Play subtle click sound
        playSound.buttonClick();
      },

      clearCart: () => set({ items: [], appliedPromo: null }),

      setPromo: (appliedPromo) => set({ appliedPromo }),

      setItems: (items) =>
        set({
          items: items.map((item) => ({
            ...item,
            menuItemId: item.menuItemId ?? item.id,
          })),
          appliedPromo: null,
        }),

      syncWithProducts: (products) => {
        const productMap = new Map(products.map((product) => [product.id, product]));

        set((state) => ({
          items: state.items.map((item) => {
            const menuItemId = item.menuItemId ?? item.id;
            const liveProduct = productMap.get(menuItemId);

            if (!liveProduct) {
              return {
                ...item,
                menuItemId,
                isAvailable: false,
              };
            }

            return {
              ...item,
              id: liveProduct.id,
              menuItemId: liveProduct.id,
              categoryId: liveProduct.categoryId,
              name: liveProduct.name,
              description: liveProduct.description,
              price: liveProduct.price,
              image: liveProduct.imageUrl,
              isAvailable:
                liveProduct.isActive &&
                liveProduct.availability === ProductAvailabilityEnum.AVAILABLE,
            };
          }),
        }));
      },

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getDiscount: () => {
        const { appliedPromo } = get();
        const subtotal = get().getSubtotal();
        return calculatePromoDiscount(appliedPromo, subtotal);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getFinalTotal: (deliveryFee: number) => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        return Math.max(0, subtotal - discount + deliveryFee);
      },
    }),
    {
      name: 'turon-cart-storage',
    }
  )
);
