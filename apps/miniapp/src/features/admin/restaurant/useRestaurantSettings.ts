import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import type { RestaurantOpenStatusModel, RestaurantSettingsModel } from './restaurantSettings.types';
import { normalizeRestaurantSettings } from './restaurantSettings.utils';

const settingsKey = ['admin-restaurant-settings'] as const;
const statusKey = ['admin-restaurant-open-status'] as const;

export function useRestaurantSettings() {
  return useQuery<RestaurantSettingsModel>({
    queryKey: settingsKey,
    queryFn: async () => normalizeRestaurantSettings(await api.get('/admin/restaurant/settings')),
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

export function useRestaurantOpenStatus() {
  return useQuery<RestaurantOpenStatusModel>({
    queryKey: statusKey,
    queryFn: async () => (await api.get('/admin/restaurant/open-status')) as RestaurantOpenStatusModel,
    refetchInterval: 60_000,
  });
}

export function useUpdateRestaurantSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<RestaurantSettingsModel>) =>
      (await api.patch('/admin/restaurant/settings', payload)) as RestaurantSettingsModel,
    onSuccess: (value) => {
      queryClient.setQueryData(settingsKey, normalizeRestaurantSettings(value));
      queryClient.invalidateQueries({ queryKey: statusKey });
    },
  });
}

export function useUploadRestaurantLogo() {
  return useMutation({
    mutationFn: async (imageBase64: string) =>
      (await api.post('/admin/restaurant/logo', { imageBase64 })) as { url: string },
  });
}
