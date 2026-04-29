import React from 'react';
import { ChevronLeft, Phone, X } from 'lucide-react';

export interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  online?: boolean;
  onBack?: () => void;
  onCall?: () => void;
  onClose?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  subtitle,
  online,
  onBack,
  onCall,
  onClose,
}) => {
  return (
    <header
      className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--app-line)] bg-[var(--app-surface)] px-3 text-[var(--app-text)]"
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Orqaga"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--app-text)] transition-colors active:scale-95 hover:bg-[var(--app-soft)]"
        >
          <ChevronLeft size={20} />
        </button>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[15px] font-black leading-tight">{title}</p>
          {typeof online === 'boolean' ? (
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                online ? 'bg-emerald-500' : 'bg-[var(--app-muted)] opacity-60'
              }`}
            />
          ) : null}
        </div>
        {subtitle ? (
          <p className="truncate text-[11px] font-semibold text-[var(--app-muted)]">{subtitle}</p>
        ) : null}
      </div>

      {onCall ? (
        <button
          type="button"
          onClick={onCall}
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
  );
};

export default ChatHeader;
