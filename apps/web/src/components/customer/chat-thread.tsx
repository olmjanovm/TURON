'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { useKeyboard } from '@/hooks/use-keyboard';

/** Chat thread'dagi bitta xabar (admin/kuryer suhbatlari uchun umumiy shakl). */
export interface ThreadMessage {
  id: string;
  /** Mijozning o'z xabarimi (o'ngga, qizil) yoki boshqaniki (chapga). */
  mine: boolean;
  senderName?: string;
  text: string;
  createdAt: string;
  isRead?: boolean;
  status?: 'pending' | 'failed';
  errorMessage?: string;
}

/**
 * Qayta ishlatiladigan chat oynasi — header + xabarlar + (ixtiyoriy) yozish paneli.
 * `/messages/admin` va `/messages/courier/[id]` shu komponentdan foydalanadi.
 * Klaviatura ochilganda panel uning ustiga ko'tariladi (Telegram WebView pattern).
 */
export function ChatThread({
  title,
  subtitle,
  messages,
  loading,
  onSend,
  onRetry,
  quickReplies,
  emptyHint = 'Hali xabar yo‘q.',
  composerDisabled = false,
  disabledHint,
  headerRight,
}: {
  title: string;
  subtitle?: string;
  messages: ThreadMessage[];
  loading?: boolean;
  onSend?: (text: string) => void;
  onRetry?: (text: string) => void;
  quickReplies?: string[];
  emptyHint?: string;
  composerDisabled?: boolean;
  disabledHint?: string;
  headerRight?: React.ReactNode;
}) {
  const router = useRouter();
  const [text, setText] = useState('');
  const { isOpen: kbOpen, height: kbHeight } = useKeyboard();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, kbOpen]);

  const submit = (value?: string) => {
    if (!onSend) return;
    const content = (value ?? text).trim();
    if (!content) return;
    if (value === undefined) setText('');
    onSend(content);
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
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-slate-900 dark:text-slate-50">{title}</p>
          {subtitle && <p className="truncate text-[10px] text-slate-400">{subtitle}</p>}
        </div>
        {headerRight}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 px-4 py-4" style={{ paddingBottom: composerDisabled ? 40 : 150 }}>
        {loading ? (
          <p className="py-10 text-center text-sm text-slate-400">Yuklanmoqda…</p>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">{emptyHint}</p>
        ) : (
          messages.map((m) => {
            const failed = m.mine && m.status === 'failed';
            return (
              <div key={m.id} className={`flex flex-col ${m.mine ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.mine
                      ? 'bg-gradient-to-br from-[#c62020] to-[#f97316] text-white'
                      : 'border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
                  }`}
                >
                  {!m.mine && m.senderName && (
                    <p className="mb-0.5 text-[10px] font-bold text-slate-400">{m.senderName}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p
                    className={`mt-0.5 flex items-center justify-end gap-1 text-[9px] ${
                      m.mine ? 'text-white/70' : 'text-slate-300'
                    }`}
                  >
                    <span>
                      {new Date(m.createdAt).toLocaleTimeString('uz-UZ', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {m.mine && m.status === 'pending' && <Clock size={11} aria-label="Yuborilmoqda" />}
                    {failed && <AlertCircle size={11} className="text-amber-200" aria-label="Yuborilmadi" />}
                    {m.mine && !m.status &&
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
                    onClick={() => (onRetry ? onRetry(m.text) : submit(m.text))}
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

      {/* Yozish paneli yoki "yo'q" sababini ko'rsatuvchi izoh */}
      {composerDisabled ? (
        disabledHint ? (
          <div
            className="fixed inset-x-0 z-40 mx-auto w-full max-w-[480px] border-t border-slate-100 bg-white/95 px-4 py-3 text-center text-xs text-slate-400 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95"
            style={{ bottom: 0, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
          >
            {disabledHint}
          </div>
        ) : null
      ) : (
        <div
          className="fixed inset-x-0 z-40 mx-auto w-full max-w-[480px] border-t border-slate-100 bg-white/95 px-3 pt-2 backdrop-blur-xl transition-[bottom] duration-200 dark:border-slate-800 dark:bg-slate-950/95"
          style={{
            bottom: kbOpen ? kbHeight : 0,
            paddingBottom: kbOpen ? 8 : 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
          }}
        >
          {quickReplies && quickReplies.length > 0 && (
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {quickReplies.map((q) => (
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
          )}
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
      )}
    </div>
  );
}
