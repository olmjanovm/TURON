import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Address } from '../data/types';

interface AddressState {
  selectedAddressId: string | null;
  draftAddress: Partial<Address> | null;
  
  // Actions
  selectAddress: (id: string | null) => void;
  updateDraft: (fields: Partial<Address>) => void;
  clearDraft: () => void;
  setInitialDraft: (address?: Address) => void;
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      selectedAddressId: null,
      draftAddress: null,

      selectAddress: (id) => set({ selectedAddressId: id }),

      updateDraft: (fields) => {
        const { draftAddress } = get();
        set({ draftAddress: { ...draftAddress, ...fields } });
      },

      clearDraft: () => set({ draftAddress: null }),

      setInitialDraft: (address) => {
        if (address) {
          set({ draftAddress: { ...address } });
        } else {
          set({ 
            draftAddress: { 
              label: 'Uy', 
              latitude: 41.2995, 
              longitude: 69.2401,
              note: '',
              addressText: '' 
            } 
          });
        }
      },
    }),
    {
      name: 'turon-address-storage',
      partialize: (state) => ({
        selectedAddressId: state.selectedAddressId,
        draftAddress: state.draftAddress,
      }),
    }
  )
);
