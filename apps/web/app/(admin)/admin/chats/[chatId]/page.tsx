'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, Send, Clock, Check, AlertCircle } from 'lucide-react';
import { useChatMessages, useSendChat } from '@/hooks/use-admin-chats';
import { SkeletonRow } from '@/components/ui/skeleton';

export default function AdminChatThreadPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId: raw } = use(params);
  const chatId = decodeURIComponent(raw);
  const role = (useSearchParams().get('role') === 'courier' ? 'COURIER' : 'CUSTOMER') as 'COURIER' | 'CUSTOMER';

  const { data: messages, isLoading, isError } = useChatMessages(chatId);
  const send = useSendChat(chatId, role);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length]);

  function submit() {
    const content = text.trim();
    if (!content) return;
    setText('');
    send.mutate(content);
  }

  return (
    <div className="flex min-h-[calc(100dvh-180px)] flex-col">
      <Link href="/admin/chats" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500">
        <ChevronLeft size={18} /> Suhbatlar
      </Link>

      {/* Xabarlar */}
      <div className="flex-1 space-y-2 overflow-y-auto pb-4">
        {isLoading ? (
          <><SkeletonRow /><SkeletonRow /></>
        ) : isError ? (
          <div className="admin-card p-6 text-center text-sm text-slate-500">Yuklashda xatolik.</div>
        ) : (messages ?? []).length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">Xabar yo'q</p>
        ) : (
          (messages ?? []).map((m) => {
            const mine = m.senderRole === 'ADMIN';
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${mine ? 'bg-gradient-to-br from-ember to-orange-500 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>
                  {!mine && <p className="mb-0.5 text-[10px] font-bold text-slate-400">{m.senderName}</p>}
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p className={`mt-0.5 flex items-center justify-end gap-1 text-[9px] ${mine ? 'text-white/70' : 'text-slate-300'}`}>
                    <span>{new Date(m.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                    {mine && m.status === 'pending' && <Clock size={11} aria-label="Yuborilmoqda" />}
                    {mine && m.status === 'failed' && <AlertCircle size={11} className="text-rose-200" aria-label="Yuborilmadi" />}
                    {mine && !m.status && <Check size={11} aria-label="Yuborildi" />}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input — pastda fixed (nav bu sahifada ko'rinadi, shu sabab nav ustida) */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
      >
        <div className="mx-auto flex w-full max-w-[480px] items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Xabar yozing..."
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-ember"
          />
          <button
            type="button"
            disabled={!text.trim()}
            onClick={submit}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-ember to-orange-500 text-white shadow-lg shadow-ember/30 active:scale-90 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
