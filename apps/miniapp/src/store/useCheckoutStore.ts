import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_DELIVERY_FEE } from '@turon/shared';
import { PaymentMethod } from '../data/types';

interface CheckoutState {
  paymentMethod: PaymentMethod;
  note: string;
  deliveryFee: number;
  setPaymentMethod: (method: PaymentMethod) => void;
  setNote: (note: string) => void;
  setDeliveryFee: (fee: number) => void;
  resetCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      paymentMethod: PaymentMethod.CASH,
      note: '',
      deliveryFee: DEFAULT_DELIVERY_FEE,

      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
      setNote: (note) => set({ note }),
      setDeliveryFee: (deliveryFee) => set({ deliveryFee }),
      resetCheckout: () => set({ paymentMethod: PaymentMethod.CASH, note: '', deliveryFee: DEFAULT_DELIVERY_FEE }),
    }),
    {
      name: 'turon-checkout-storage',
    }
  )
);
