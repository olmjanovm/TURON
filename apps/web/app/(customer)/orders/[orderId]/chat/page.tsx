'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { useOrderChat, useSendOrderMessage } from '@/hooks/use-customer';
import { useKeyboard } from '@/hooks/use-keyboard';

/** Tezkor javoblar — bir teginishda yuboriladi. */
const QUICK_REPLIES = [
  'Qachon yetkaziladi?',
  'Iltimos, tezroq',
  'Manzil haqida',
  'Rahmat! 🙏',
];

export default function OrderChatPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const { data: messages, isLoading } = useOrderChat(orderId);
  const send = useSendOrderMessage(orderId);
  const [text, setText] = useState('');
  const { isOpen: kbOpen, height: kbHeight } = useKeyboard();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length, kbOpen]);

  const submit = (value?: string) => {
    const content = (value ?? text).trim();
    if (!content) return;
    if (value === undefined) setText('');
    send.mutate(content);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900 dark:text-slate-50">Admin bilan suhbat</p>
          <p className="text-[10px] text-slate-400">Buyurtma bo&apos;yicha savol-javob</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 px-4 py-4" style={{ paddingBottom: 150 }}>
        {isLoading ? (
          <p className="py-10 text-center text-sm text-slate-400">Yuklanmoqda…</p>
        ) : (messages ?? []).length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            Hali xabar yo&apos;q. Savolingizni yozing yoki tezkor javoblardan tanlang 👇
          </p>
        ) : (
          (messages ?? []).map((m) => {
            const mine = m.senderRole === 'CUSTOMER';
            const failed = mine && m.status === 'failed';
            return (
              <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine
                      ? 'bg-gradient-to-br from-[#c62020] to-[#f97316] text-white'
                      : 'border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
                  }`}
                >
                  {!mine && (
                    <p className="mb-0.5 text-[10px] font-bold text-slate-400">{m.senderName}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p
                    className={`mt-0.5 flex items-center justify-end gap-1 text-[9px] ${
                      mine ? 'text-white/70' : 'text-slate-300'
                    }`}
                  >
                    <span>
                      {new Date(m.createdAt).toLocaleTimeString('uz-UZ', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {mine && m.status === 'pending' && <Clock size={11} aria-label="Yuborilmoqda" />}
                    {failed && <AlertCircle size={11} className="text-amber-200" aria-label="Yuborilmadi" />}
                    {mine && !m.status &&
                      (m.isRead ? (
                        <CheckCheck size={13} aria-label="O'qildi" />
                      ) : (
                        <Check size={12} aria-label="Yuborildi" />
                      ))}
                  </p>
                </div>
                {failed && (
                  <button
                    type="button"
                    onClick={() => submit(m.content)}
                    className="mt-0.5 flex items-center gap-1 px-1 text-[10px] font-semibold text-rose-500 active:scale-95"
                  >
                    <AlertCircle size={10} />
                    <span>{m.errorMessage || 'Yuborilmadi'} · Qayta yuborish</span>
                  </button>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Pastki panel — tezkor javoblar + input. Klaviatura ustiga lift bo'ladi. */}
      <div
        className="fixed inset-x-0 z-40 mx-auto w-full max-w-[480px] border-t border-slate-100 bg-white/95 px-3 pt-2 backdrop-blur-xl transition-[bottom] duration-200 dark:border-slate-800 dark:bg-slate-950/95"
        style={{
          bottom: kbOpen ? kbHeight : 0,
          paddingBottom: kbOpen ? 8 : 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
        }}
      >
        {/* Tezkor javoblar */}
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => submit(q)}
              className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Xabar yozing..."
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#c62020] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <button
            type="button"
            disabled={!text.trim()}
            onClick={() => submit()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-white shadow-lg shadow-[#c62020]/30 active:scale-90 disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
