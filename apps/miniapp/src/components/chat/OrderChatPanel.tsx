import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircle, Send, X } from 'lucide-react';
import { useOrderChat, type ChatMessage } from '../../hooks/queries/useOrderChat';
import { useAuthStore } from '../../store/useAuthStore';

// ── Quick reply chips ─────────────────────────────────────────────────────────
const COURIER_QUICK = [
  "Yo'ldaman",
  "5 daqiqada yetaman",
  "Manzilni to'g'rilang",
  "Qayerda kutasiz?",
  "Restoranda kutmoqdaman",
];

const CUSTOMER_QUICK = [
  "OK, kutaman",
  "Eshik oldida bo'laman",
  "Qo'ng'iroq qiling",
  "10 daqiqa kuting",
  "Tayyor",
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({
  msg,
  isMine,
  theme,
}: {
  msg: ChatMessage;
  isMine: boolean;
  theme: 'light' | 'dark';
}) {
  const isDark = theme === 'dark';

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-[18px] px-3.5 py-2.5 ${
          isMine
            ? isDark
              ? 'rounded-br-[6px] bg-indigo-500 text-white'
              : 'rounded-br-[6px] bg-indigo-600 text-white'
            : isDark
              ? 'rounded-bl-[6px] bg-white/[0.09] text-white/90'
              : 'rounded-bl-[6px] bg-slate-100 text-slate-900'
        }`}
      >
        {!isMine && (
          <p
            className={`mb-1 text-[10px] font-black uppercase tracking-wide ${
              isDark ? 'text-white/45' : 'text-slate-400'
            }`}
          >
            {msg.senderRole === 'COURIER' ? 'Kuryer' : 'Mijoz'}
          </p>
        )}
        <p className="text-[13px] font-semibold leading-snug">{msg.content}</p>
        <p
          className={`mt-1 text-right text-[10px] ${
            isMine ? 'text-white/60' : isDark ? 'text-white/35' : 'text-slate-400'
          }`}
        >
          {formatTime(msg.createdAt)}
        </p>
      </div>
    </div>
  );
}

interface OrderChatPanelProps {
  orderId: string;
  role: 'courier' | 'customer';
  onClose?: () => void;
  theme?: 'light' | 'dark';
  /** If true renders inline (no overlay/backdrop) */
  inline?: boolean;
}

export const OrderChatPanel: React.FC<OrderChatPanelProps> = ({
  orderId,
  role,
  onClose,
  theme = 'light',
  inline = false,
}) => {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const { messages, isLoading, sendMessage, isSending, connected } = useOrderChat(orderId, role);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const isDark = theme === 'dark';

  const quickReplies = role === 'courier' ? COURIER_QUICK : CUSTOMER_QUICK;

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || isSending) return;
    setDraft('');
    try {
      await sendMessage(text);
    } catch {
      setDraft(text); // restore on error
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const content = (
    <div
      className={`flex h-full flex-col ${
        isDark
          ? 'bg-slate-950 text-white'
          : 'bg-white text-slate-900'
      }`}
    >
      {/* Header */}
      <div
        className={`flex shrink-0 items-center justify-between px-4 py-3 ${
          isDark ? 'border-b border-white/8' : 'border-b border-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <MessageCircle size={18} className={isDark ? 'text-indigo-300' : 'text-indigo-500'} />
          <p className="text-[15px] font-black">
            {role === 'courier' ? 'Mijoz bilan yozishuv' : 'Kuryer bilan yozishuv'}
          </p>
          {/* Connection dot */}
          <span
            className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-400 animate-pulse'}`}
          />
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors active:scale-95 ${
              isDark ? 'bg-white/8 text-white/60' : 'bg-slate-100 text-slate-500'
            }`}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={22} className="animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                isDark ? 'bg-white/8' : 'bg-slate-100'
              }`}
            >
              <MessageCircle size={24} className={isDark ? 'text-white/30' : 'text-slate-300'} />
            </div>
            <p
              className={`text-[13px] font-bold ${isDark ? 'text-white/40' : 'text-slate-400'}`}
            >
              Xabarlar yo'q
            </p>
            <p
              className={`text-[11px] ${isDark ? 'text-white/25' : 'text-slate-300'}`}
            >
              Birinchi xabarni yuboring
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMine={msg.senderId === userId}
                theme={theme}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Quick reply chips */}
      <div
        className={`shrink-0 overflow-x-auto px-4 py-2 ${
          isDark ? 'border-t border-white/8' : 'border-t border-slate-100'
        }`}
      >
        <div className="flex gap-2">
          {quickReplies.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setDraft(q)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-black transition-colors active:scale-95 ${
                isDark
                  ? 'bg-white/8 text-white/70 hover:bg-white/14'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input row */}
      <div
        className={`shrink-0 px-3 py-3 ${
          isDark ? 'border-t border-white/8' : 'border-t border-slate-100'
        }`}
      >
        <div
          className={`flex items-end gap-2 rounded-[22px] border px-3 py-2 ${
            isDark
              ? 'border-white/10 bg-white/[0.06]'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Xabar yozing..."
            rows={1}
            maxLength={500}
            className={`flex-1 resize-none bg-transparent text-[13px] font-semibold outline-none placeholder:font-normal ${
              isDark ? 'text-white placeholder:text-white/30' : 'text-slate-900 placeholder:text-slate-400'
            }`}
            style={{ maxHeight: '96px', overflowY: 'auto' }}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!draft.trim() || isSending}
            className={`mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-40 ${
              isDark
                ? 'bg-indigo-500 text-white'
                : 'bg-indigo-600 text-white'
            }`}
          >
            {isSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
      </div>
    </div>
  );

  if (inline) return content;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <div className="mt-auto max-h-[70vh] w-full overflow-hidden rounded-t-[28px] shadow-2xl">
        {content}
      </div>
    </div>
  );
};

export default OrderChatPanel;
