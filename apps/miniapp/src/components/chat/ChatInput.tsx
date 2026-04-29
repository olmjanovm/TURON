import React from 'react';
import { Loader2, SendHorizontal } from 'lucide-react';

export interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  isSending?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  disabled,
  isSending,
  placeholder = 'Xabar yozing...',
  maxLength = 500,
}) => {
  const handleKey = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
    }
  };

  const canSend = !disabled && !isSending && value.trim().length > 0;

  return (
    <div
      className="flex items-end gap-2 rounded-[18px] border border-[var(--app-line)] bg-[var(--app-surface)] px-3 py-2"
      style={{ boxShadow: 'var(--app-soft-shadow)' }}
    >
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        rows={1}
        maxLength={maxLength}
        className="max-h-[110px] flex-1 resize-none bg-transparent py-1 text-[14px] font-medium leading-snug text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)]"
      />
      <button
        type="button"
        onClick={() => {
          if (canSend) onSend();
        }}
        disabled={!canSend}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-all active:scale-95 disabled:bg-indigo-600/30 disabled:text-white/60"
      >
        {isSending ? <Loader2 size={15} className="animate-spin" /> : <SendHorizontal size={15} />}
      </button>
    </div>
  );
};

export default ChatInput;
