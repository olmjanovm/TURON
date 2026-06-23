'use client';

import { useMemo, useState } from 'react';
import { ChatThread, type ThreadMessage } from '@/components/customer/chat-thread';
import {
  useSupportThread,
  useSendSupportMessage,
  useEditSupportMessage,
  useDeleteSupportMessage,
} from '@/hooks/use-customer';

const QUICK_REPLIES = [
  'Buyurtmam holati qanday?',
  'Yetkazish narxi haqida',
  'Promokod ishlamayapti',
  'Rahmat! 🙏',
];

export default function AdminChatPage() {
  const { data: thread, isLoading } = useSupportThread();
  const send = useSendSupportMessage();
  const edit = useEditSupportMessage();
  const del = useDeleteSupportMessage();
  // Optimistic: server javobigacha o'z xabarimiz darhol ko'rinadi
  const [pending, setPending] = useState<Array<{ id: string; text: string; failed?: boolean }>>([]);

  const messages: ThreadMessage[] = useMemo(() => {
    const base: ThreadMessage[] = (thread?.messages ?? []).map((m) => ({
      id: m.id,
      mine: m.senderRole === 'CUSTOMER',
      senderName: m.senderRole === 'ADMIN' ? 'Admin' : m.senderLabel,
      text: m.text,
      createdAt: m.createdAt,
    }));
    const opt: ThreadMessage[] = pending.map((p) => ({
      id: p.id,
      mine: true,
      text: p.text,
      createdAt: new Date().toISOString(),
      status: p.failed ? 'failed' : 'pending',
    }));
    return [...base, ...opt];
  }, [thread, pending]);

  const handleSend = (text: string) => {
    const id = `temp-${Date.now()}`;
    setPending((p) => [...p, { id, text }]);
    send.mutate(text, {
      onSuccess: () => setPending((p) => p.filter((x) => x.id !== id)),
      onError: () => setPending((p) => p.map((x) => (x.id === id ? { ...x, failed: true } : x))),
    });
  };

  const handleRetry = (text: string) => {
    setPending((p) => p.filter((x) => !(x.failed && x.text === text)));
    handleSend(text);
  };

  return (
    <ChatThread
      title="Admin bilan suhbat"
      subtitle="Yordam xizmati"
      messages={messages}
      loading={isLoading}
      onSend={handleSend}
      onRetry={handleRetry}
      onEditMessage={(id, text) => edit.mutate({ id, text })}
      onDeleteMessage={(id) => del.mutate(id)}
      quickReplies={QUICK_REPLIES}
      emptyHint="Hali xabar yo‘q. Savolingizni yozing yoki tezkor javoblardan tanlang 👇"
    />
  );
}
