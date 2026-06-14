'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export interface AdminChatEntry {
  orderId: string;
  orderNumber: string;
  unreadCount: number;
  lastMessage: string;
  lastAt: string;
}
export interface AdminInbox {
  courierMessages: AdminChatEntry[];
  customerMessages: AdminChatEntry[];
}
export interface AdminChatMessage {
  id: string;
  orderId: string;
  senderRole: 'COURIER' | 'CUSTOMER' | 'ADMIN';
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  /** Faqat optimistic (klient) holat — serverdan kelgan xabarda bo'lmaydi (= yuborilgan). */
  status?: 'pending' | 'failed';
}

/** Order-chat va support thread endpointlarini hal qiladi. */
function endpoints(chatId: string) {
  if (chatId.startsWith('support:')) {
    const t = chatId.slice('support:'.length);
    return { list: `/api/support/admin/${t}/messages`, send: `/api/support/admin/${t}/messages` };
  }
  return { list: `/api/orders/${chatId}/admin-chat`, send: `/api/orders/${chatId}/admin-chat` };
}

export function useAdminInbox() {
  return useQuery<AdminInbox>({
    queryKey: ['admin', 'chat-inbox'],
    queryFn: () => apiFetch<AdminInbox>('/api/orders/chats'),
    refetchInterval: 12_000,
  });
}

export function useChatMessages(chatId: string) {
  return useQuery<AdminChatMessage[]>({
    queryKey: ['admin', 'chat', chatId],
    queryFn: () => apiFetch<AdminChatMessage[]>(endpoints(chatId).list),
    enabled: Boolean(chatId),
    refetchInterval: 5_000, // polling (Socket.io keyingi fazada)
  });
}

const CHAT_KEY = (chatId: string) => ['admin', 'chat', chatId] as const;

/**
 * Xabar yuborish — OPTIMISTIC (Telegram singari):
 *  • Yuborilishi bilanoq xabar suhbatda darhol ko'rinadi (kutish — soat ikonkasi bilan).
 *  • Server tasdiqlasa — haqiqiy xabar bilan almashtiriladi (refetch).
 *  • Xato bo'lsa — xabar "failed" (qizil) bo'lib qoladi, yo'qolmaydi.
 * Shunday qilib input qotmaydi, tez-tez yozish/yuborish mumkin.
 */
export function useSendChat(chatId: string, targetRole: 'COURIER' | 'CUSTOMER') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiFetch(endpoints(chatId).send, {
        method: 'POST',
        body: JSON.stringify({ content, targetRole }),
      }),
    onMutate: async (content: string) => {
      await qc.cancelQueries({ queryKey: CHAT_KEY(chatId) });
      const prev = qc.getQueryData<AdminChatMessage[]>(CHAT_KEY(chatId));
      const tempId = `temp-${Date.now()}`;
      const optimistic: AdminChatMessage = {
        id: tempId,
        orderId: chatId,
        senderRole: 'ADMIN',
        senderName: 'Siz',
        content,
        isRead: false,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      qc.setQueryData<AdminChatMessage[]>(CHAT_KEY(chatId), (old) => [...(old ?? []), optimistic]);
      return { tempId };
    },
    onError: (_err, _content, ctx) => {
      // Optimistic xabarni "failed" deb belgilaymiz (yo'qotmaymiz)
      if (ctx?.tempId) {
        qc.setQueryData<AdminChatMessage[]>(CHAT_KEY(chatId), (old) =>
          (old ?? []).map((m) => (m.id === ctx.tempId ? { ...m, status: 'failed' } : m)),
        );
      }
    },
    onSuccess: () => {
      // Haqiqiy server xabari bilan almashtirish + inbox yangilash
      qc.invalidateQueries({ queryKey: CHAT_KEY(chatId) });
      qc.invalidateQueries({ queryKey: ['admin', 'chat-inbox'] });
    },
  });
}
