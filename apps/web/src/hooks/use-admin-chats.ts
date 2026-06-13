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

export function useSendChat(chatId: string, targetRole: 'COURIER' | 'CUSTOMER') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiFetch(endpoints(chatId).send, {
        method: 'POST',
        body: JSON.stringify({ content, targetRole }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'chat', chatId] });
      qc.invalidateQueries({ queryKey: ['admin', 'chat-inbox'] });
    },
  });
}
