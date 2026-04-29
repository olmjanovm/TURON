import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupportThread } from '../../data/types';
import { api } from '../../lib/api';

function getSupportThreadKey(orderId?: string | null) {
  return ['support-thread', orderId || 'general'];
}

export function useSupportThread(orderId?: string | null) {
  return useQuery<SupportThread>({
    queryKey: getSupportThreadKey(orderId),
    queryFn: async () =>
      (await api.get('/support/thread', {
        params: orderId ? { orderId } : undefined,
      })) as SupportThread,
    refetchInterval: 1500,
    staleTime: 750,
  });
}

export function useSendSupportMessage(orderId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ text, topic }: { text: string; topic?: string }) =>
      (await api.post('/support/messages', {
        orderId: orderId || undefined,
        text,
        topic,
      })) as SupportThread,
    onSuccess: (thread) => {
      queryClient.setQueryData(getSupportThreadKey(orderId), thread);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: getSupportThreadKey(orderId) });
    },
  });
}
