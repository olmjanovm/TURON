'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

/**
 * Kuryer ↔ admin (order-chat) — mavjud backend endpointlarini qayta ishlatadi:
 *   GET  /courier/order/:id/chat
 *   POST /courier/order/:id/chat   { content }
 *
 * Backend `verifyAccess` kuryerga BIRON PAYT biriktirilgan har qanday
 * buyurtma uchun ruxsat beradi → tarixdagi (DELIVERED/CANCELLED) buyurtmalar
 * bo'yicha ham admin bilan yozishish mumkin. Backend o'zgartirilmaydi.
 */
export interface CourierChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderRole: 'COURIER' | 'CUSTOMER' | 'ADMIN';
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  targetRole?: 'COURIER' | 'CUSTOMER' | null;
  /** Faqat optimistic (klient) holat. */
  status?: 'pending' | 'failed';
}

const CHAT_KEY = (orderId: string) => ['courier', 'chat', orderId] as const;
const UNREAD_KEY = (orderId: string) => ['courier', 'chat-unread', orderId] as const;

/** Bitta buyurtma uchun o'qilmagan admin/peer xabarlari soni (order detail badge). */
export function useOrderChatUnread(orderId: string | undefined, enabled = true) {
  return useQuery<number>({
    queryKey: UNREAD_KEY(orderId ?? ''),
    queryFn: async () => {
      const res = await apiFetch<{ count: number }>(`/courier/order/${orderId}/chat/unread`);
      return res?.count ?? 0;
    },
    enabled: Boolean(orderId) && enabled,
    refetchInterval: 15_000,
  });
}

/**
 * Bir nechta buyurtma uchun unread (tarix ro'yxati badge'lari).
 * FAQAT kuryer bog'langan buyurtmalar uchun chaqiriladi (kichik to'plam → N+1 yo'q).
 * Qaytadi: { orderId: count } map.
 */
export function useOrdersChatUnread(orderIds: string[]): Record<string, number> {
  const results = useQueries({
    queries: orderIds.map((id) => ({
      queryKey: UNREAD_KEY(id),
      queryFn: async () => {
        const res = await apiFetch<{ count: number }>(`/courier/order/${id}/chat/unread`);
        return res?.count ?? 0;
      },
      refetchInterval: 20_000,
    })),
  });
  const map: Record<string, number> = {};
  orderIds.forEach((id, i) => {
    map[id] = (results[i]?.data as number | undefined) ?? 0;
  });
  return map;
}

export function useOrderChat(orderId: string | undefined, enabled = true) {
  return useQuery<CourierChatMessage[]>({
    queryKey: CHAT_KEY(orderId ?? ''),
    queryFn: () => apiFetch<CourierChatMessage[]>(`/courier/order/${orderId}/chat`),
    enabled: Boolean(orderId) && enabled,
    refetchInterval: 5_000, // polling — admin chat bilan bir xil naqsh
  });
}

/**
 * Xabar yuborish — OPTIMISTIC: xabar darhol ko'rinadi (soat ikonkasi),
 * server tasdiqlasa refetch, xato bo'lsa "failed" (qizil) bo'lib qoladi.
 */
export function useSendOrderChat(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiFetch<CourierChatMessage>(`/courier/order/${orderId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    onMutate: async (content: string) => {
      await qc.cancelQueries({ queryKey: CHAT_KEY(orderId) });
      const prev = qc.getQueryData<CourierChatMessage[]>(CHAT_KEY(orderId));
      const tempId = `temp-${Date.now()}`;
      const optimistic: CourierChatMessage = {
        id: tempId,
        orderId,
        senderId: 'me',
        senderRole: 'COURIER',
        senderName: 'Siz',
        content,
        isRead: false,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      qc.setQueryData<CourierChatMessage[]>(CHAT_KEY(orderId), (old) => [...(old ?? []), optimistic]);
      return { tempId, prev };
    },
    onError: (_err, _content, ctx) => {
      if (ctx?.tempId) {
        qc.setQueryData<CourierChatMessage[]>(CHAT_KEY(orderId), (old) =>
          (old ?? []).map((m) => (m.id === ctx.tempId ? { ...m, status: 'failed' } : m)),
        );
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CHAT_KEY(orderId) });
    },
  });
}
