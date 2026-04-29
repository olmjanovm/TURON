import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Phone, X } from 'lucide-react';
import { useOrderChat } from '../../hooks/queries/useOrderChat';
import { useAuthStore } from '../../store/useAuthStore';
import { initiateCall } from '../../lib/callUtils';
import { ChatBubble, type ChatBubbleStatus } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { ChatEmpty } from './ChatEmpty';
import { QuickReplyChips } from './QuickReplyChips';

const COURIER_QUICK = [
  "Yo'ldaman",
  '5 daqiqada yetaman',
  "Manzilni to'g'rilang",
  'Qayerda kutasiz?',
  'Restoranda kutmoqdaman',
] as const;

const CUSTOMER_QUICK = [
  'OK, kutaman',
  "Eshik oldida bo'laman",
  "Qo'ng'iroq qiling",
  '10 daqiqa kuting',
  'Tayyor',
] as const;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}

function authorLabelOf(role: 'COURIER' | 'CUSTOMER' | 'ADMIN') {
  if (role === 'COURIER') return 'Kuryer';
  if (role === 'ADMIN') return 'Operator';
  return 'Mijoz';
}

function UnreadReminderBanner({
  phoneNumber,
  onDismiss,
}: {
  phoneNumber?: string | null;
  onDismiss: () => void;
}) {
  const handleCall = () => initiateCall(phoneNumber);

  return (
    <div className="mx-3 mb-2 flex items-center gap-3 rounded-[14px] border border-amber-200 bg-amber-50 p-3 dark:border-amber-400/25 dark:bg-amber-500/15">
      <div className="relative shrink-0">
        <div className="absolute inset-0 animate-ping rounded-full bg-amber-400/40" />
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-400/20">
          <Phone size={16} className="text-amber-600 dark:text-amber-300" />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-black text-amber-800 dark:text-amber-200">
          Xabar o'qilmadi
        </p>
        <p className="truncate text-[11px] font-medium text-amber-700 dark:text-amber-300/80">
          Qo'ng'iroq qilib ko'rasizmi?
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        {phoneNumber ? (
          <button
            type="button"
            onClick={handleCall}
            className="flex h-8 items-center gap-1.5 rounded-full bg-amber-500 px-3 text-[11px] font-black text-white transition-all active:scale-95 dark:bg-amber-400/25 dark:text-amber-200"
          >
            <Phone size={11} />
            Qo'ng'iroq
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Yopish"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all active:scale-95 dark:bg-white/10 dark:text-white/60"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

interface OrderChatPanelProps {
  orderId: string;
  role: 'courier' | 'customer';
  /** Phone number of the OTHER party */
  otherPartyPhone?: string | null;
  onClose?: () => void;
  /** Soft override: forces a wrapper class so dark: variants activate */
  theme?: 'light' | 'dark';
  /** Renders inline (no overlay/backdrop) */
  inline?: boolean;
}

export const OrderChatPanel: React.FC<OrderChatPanelProps> = ({
  orderId,
  role,
  otherPartyPhone,
  onClose,
  theme,
  inline = false,
}) => {
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const [showReminder, setShowReminder] = useState(false);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const { messages, isLoading, sendMessage, isSending, connected } = useOrderChat(
    orderId,
    role,
    {
      onUnreadReminder: () => setShowReminder(true),
    },
  );

  const quickReplies = role === 'courier' ? COURIER_QUICK : CUSTOMER_QUICK;

  const didInitialScrollRef = useRef(false);
  useEffect(() => {
    if (!isLoading && messages.length > 0 && !didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      bottomRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    }
  }, [isLoading, messages.length]);

  useEffect(() => {
    if (!didInitialScrollRef.current) return;
    const list = listRef.current;
    if (!list) return;
    const isNearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 120;
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || isSending) return;
    setDraft('');
    setShowReminder(false);
    try {
      await sendMessage(text);
    } catch {
      setDraft(text);
    }
  };

  const wrapperCls = theme === 'dark' ? 'dark' : theme === 'light' ? '' : '';

  const content = (
    <div
      className={`${wrapperCls} flex h-full flex-col bg-[var(--app-bg)] text-[var(--app-text)]`}
    >
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--app-line)] bg-[var(--app-surface)] px-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[15px] font-black leading-tight text-[var(--app-text)]">
              {role === 'courier' ? 'Mijoz bilan yozishuv' : 'Kuryer bilan yozishuv'}
            </p>
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                connected ? 'bg-emerald-500' : 'bg-[var(--app-muted)] opacity-60'
              }`}
            />
          </div>
          <p className="truncate text-[11px] font-semibold text-[var(--app-muted)]">
            {connected ? 'Onlayn' : 'Ulanish kutilmoqda'}
          </p>
        </div>

        {otherPartyPhone ? (
          <button
            type="button"
            onClick={() => initiateCall(otherPartyPhone)}
            aria-label="Qo'ng'iroq"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 transition-all active:scale-95"
          >
            <Phone size={16} />
          </button>
        ) : null}

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--app-muted)] transition-colors active:scale-95 hover:bg-[var(--app-soft)]"
          >
            <X size={18} />
          </button>
        ) : null}
      </header>

      {showReminder ? (
        <UnreadReminderBanner
          phoneNumber={otherPartyPhone}
          onDismiss={() => setShowReminder(false)}
        />
      ) : null}

      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={22} className="animate-spin text-[var(--app-muted)]" />
          </div>
        ) : messages.length === 0 ? (
          <ChatEmpty />
        ) : (
          <div className="space-y-1.5">
            {messages.map((msg) => {
              const isOwn = msg.senderId === userId;
              const status: ChatBubbleStatus =
                msg._status === 'sending'
                  ? 'sending'
                  : msg._status === 'error'
                    ? 'failed'
                    : msg.isRead
                      ? 'read'
                      : 'sent';

              return (
                <ChatBubble
                  key={msg.id}
                  side={isOwn ? 'own' : 'other'}
                  text={msg.content}
                  time={formatTime(msg.createdAt)}
                  authorLabel={isOwn ? undefined : authorLabelOf(msg.senderRole)}
                  status={isOwn ? status : undefined}
                />
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--app-line)] bg-[var(--app-surface)] px-3 py-2">
        <QuickReplyChips items={quickReplies} onPick={(value) => setDraft(value)} />
      </div>

      <div
        className="shrink-0 px-3 py-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <ChatInput
          value={draft}
          onChange={setDraft}
          onSend={() => void handleSend()}
          isSending={isSending}
        />
      </div>
    </div>
  );

  if (inline) return content;

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
    >
      <div className="mt-auto max-h-[78vh] w-full overflow-hidden rounded-t-[24px] shadow-2xl">
        {content}
      </div>
    </div>
  );
};

export default OrderChatPanel;
