import React from 'react';
import { Check, CheckCheck, Loader2 } from 'lucide-react';

export type ChatBubbleStatus = 'sending' | 'sent' | 'read' | 'failed';

export interface ChatBubbleProps {
  side: 'own' | 'other';
  text: string;
  time?: string;
  authorLabel?: string;
  status?: ChatBubbleStatus;
}

function StatusGlyph({ status }: { status: ChatBubbleStatus }) {
  if (status === 'sending') {
    return <Loader2 size={11} className="animate-spin text-white/70" />;
  }

  if (status === 'failed') {
    return <span className="text-[10px] font-black text-rose-200">!</span>;
  }

  if (status === 'read') {
    return <CheckCheck size={12} className="text-white" />;
  }

  return <Check size={12} className="text-white/70" />;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  side,
  text,
  time,
  authorLabel,
  status,
}) => {
  const isOwn = side === 'own';

  const bubbleCls = isOwn
    ? 'rounded-br-[6px] bg-indigo-600 text-white'
    : 'rounded-bl-[6px] bg-[var(--app-soft)] text-[var(--app-text)]';

  const metaCls = isOwn ? 'text-white/70' : 'text-[var(--app-muted)]';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[78%] rounded-[18px] px-3.5 py-2 ${bubbleCls} ${
          status === 'sending' ? 'opacity-70' : 'opacity-100'
        }`}
      >
        {!isOwn && authorLabel ? (
          <p className="mb-0.5 text-[10px] font-black uppercase tracking-wide text-[var(--app-muted)]">
            {authorLabel}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap break-words text-[14px] font-medium leading-snug">
          {text}
        </p>
        <div className="mt-1 flex items-center justify-end gap-1">
          {time ? <span className={`text-[10px] font-semibold ${metaCls}`}>{time}</span> : null}
          {isOwn && status ? <StatusGlyph status={status} /> : null}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
