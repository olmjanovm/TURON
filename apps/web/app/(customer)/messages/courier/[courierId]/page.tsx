'use client';

import { use, useMemo, useState } from 'react';
import { Phone } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { ChatThread, type ThreadMessage } from '@/components/customer/chat-thread';
import { useCourierThread } from '@/hooks/use-customer';

export default function CourierChatPage({ params }: { params: Promise<{ courierId: string }> }) {
  const { courierId } = use(params);
  const qc = useQueryClient();
  const { data: thread, isLoading } = useCourierThread(courierId);
  const activeOrderId = thread?.activeOrderId ?? null;
  const key = ['customer', 'courier-thread', courierId] as const;

  const [pending, setPending] = useState<Array<{ id: string; text: string; failed?: boolean }>>([]);

  const sendMut = useMutation({
    mutationFn: (content: string) => {
      if (!activeOrderId) throw new Error('Faol buyurtma yo‘q');
      return apiFetch(`/orders/${activeOrderId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    },
  });

  const messages: ThreadMessage[] = useMemo(() => {
    const base: ThreadMessage[] = (thread?.messages ?? []).map((m) => ({
      id: m.id,
      mine: m.senderRole === 'CUSTOMER',
      senderName: m.senderRole === 'COURIER' ? thread?.courierName : m.senderName,
      text: m.content,
      createdAt: m.createdAt,
      isRead: m.isRead,
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
    sendMut.mutate(text, {
      onSuccess: () => {
        setPending((p) => p.filter((x) => x.id !== id));
        qc.invalidateQueries({ queryKey: key });
      },
      onError: () => setPending((p) => p.map((x) => (x.id === id ? { ...x, failed: true } : x))),
    });
  };

  const handleRetry = (text: string) => {
    setPending((p) => p.filter((x) => !(x.failed && x.text === text)));
    handleSend(text);
  };

  const phone = thread?.courierPhone;

  return (
    <ChatThread
      title={thread?.courierName || 'Kuryer'}
      subtitle={activeOrderId ? 'Yetkazib berish — faol' : 'Avvalgi yetkazishlar'}
      messages={messages}
      loading={isLoading}
      onSend={activeOrderId ? handleSend : undefined}
      onRetry={handleRetry}
      emptyHint="Bu kuryer bilan suhbat tarixi bo‘sh."
      composerDisabled={!activeOrderId}
      disabledHint="Faol yetkazish yo‘q — kuryerga faqat buyurtma yetkazilayotganda yozish mumkin."
      headerRight={
        phone ? (
          <a
            href={`tel:${phone}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm active:scale-95"
            aria-label="Qo‘ng‘iroq qilish"
          >
            <Phone size={16} />
          </a>
        ) : undefined
      }
    />
  );
}
