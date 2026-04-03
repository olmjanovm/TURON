import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PaymentMethod } from '../data/types';

interface CheckoutState {
  paymentMethod: PaymentMethod;
  note: string;
  setPaymentMethod: (method: PaymentMethod) => void;
  setNote: (note: string) => void;
  resetCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      paymentMethod: PaymentMethod.CASH,
      note: '',

      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
      setNote: (note) => set({ note }),
      resetCheckout: () => set({ paymentMethod: PaymentMethod.CASH, note: '' }),
    }),
    {
      name: 'turon-checkout-storage',
    }
  )
);
