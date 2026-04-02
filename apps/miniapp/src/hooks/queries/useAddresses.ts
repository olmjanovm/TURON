import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Address } from '../../data/types';

export interface AddressPayload {
  title?: string;
  address: string;
  note?: string;
  latitude: number;
  longitude: number;
}

export const useAddresses = () => {
  return useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: async () => (await api.get('/addresses')) as Address[],
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AddressPayload) => (await api.post('/addresses', data)) as Address,
    onSuccess: (createdAddress: Address) => {
      queryClient.setQueryData<Address[]>(['addresses'], (current = []) => [
        createdAddress,
        ...current.filter((address) => address.id !== createdAddress.id),
      ]);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddressPayload }) =>
      api.put(`/addresses/${id}`, data) as Promise<Address>,
    onSuccess: (updatedAddress: Address) => {
      queryClient.setQueryData<Address[]>(['addresses'], (current = []) =>
        current
          .map((address) => (address.id === updatedAddress.id ? updatedAddress : address))
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/addresses/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Address[]>(['addresses'], (current = []) =>
        current.filter((address) => address.id !== deletedId),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};
