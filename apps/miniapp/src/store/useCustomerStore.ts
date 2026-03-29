import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../data/mockData';

interface CartItem extends Product {
  quantity: number;
}

interface CustomerState {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      cart: [],
      
      addToCart: (product, quantity = 1) => {
        const { cart } = get();
        const existingItem = cart.find((item) => item.id === product.id);
        
        if (existingItem) {
          set({
            cart: cart.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({ cart: [...cart, { ...product, quantity }] });
        }
        
        // Telegram Haptic Feedback (Vibration) if available
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
      },

      removeFromCart: (productId) => {
        set({ cart: get().cart.filter((item) => item.id !== productId) });
      },

      updateQuantity: (productId, delta) => {
        const { cart } = get();
        const newCart = cart.map((item) => {
          if (item.id === productId) {
            const newQty = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQty };
          }
          return item;
        }).filter(item => item.quantity > 0);

        set({ cart: newCart });
        
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
      },

      clearCart: () => set({ cart: [] }),

      getTotalPrice: () => {
        return get().cart.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getTotalItems: () => {
        return get().cart.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'turon-customer-storage',
    }
  )
);
