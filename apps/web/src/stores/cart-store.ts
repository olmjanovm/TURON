import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartLine {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

export type CheckoutPayment = 'CASH' | 'MANUAL_TRANSFER';

export interface AppliedPromo {
  code: string;
  discountAmount: number;
}

interface CartState {
  items: CartLine[];
  // ── Checkout qoralamasi (persist) — ilova yopilib qayta ochilsa, promokod va
  //    to'lov tanlovi YO'QOLMAYDI; foydalanuvchi to'xtagan joyidan davom etadi (#6).
  appliedPromo: AppliedPromo | null;
  paymentMethod: CheckoutPayment;
  note: string;

  add: (line: Omit<CartLine, 'quantity'>, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  count: () => number;
  total: () => number;

  setPromo: (p: AppliedPromo | null) => void;
  setPaymentMethod: (m: CheckoutPayment) => void;
  setNote: (n: string) => void;
}

/** FAZA D — savat (offline-first, persist). */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedPromo: null,
      paymentMethod: 'CASH',
      note: '',
      add: (line, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === line.productId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === line.productId ? { ...i, quantity: i.quantity + qty } : i,
              ),
            };
          }
          return { items: [...s.items, { ...line, quantity: qty }] };
        }),
      setQty: (productId, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)),
        })),
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      // Buyurtma yaratilгач yoki savat tozalanganda — qoralama ham to'liq tozalanadi
      clear: () => set({ items: [], appliedPromo: null, paymentMethod: 'CASH', note: '' }),
      count: () => get().items.reduce((n, i) => n + i.quantity, 0),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      setPromo: (p) => set({ appliedPromo: p }),
      setPaymentMethod: (m) => set({ paymentMethod: m }),
      setNote: (n) => set({ note: n }),
    }),
    { name: 'turon-cart' },
  ),
);
