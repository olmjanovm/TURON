import React from 'react';
import { MessageCircle } from 'lucide-react';

export interface ChatEmptyProps {
  title?: string;
  hint?: string;
}

export const ChatEmpty: React.FC<ChatEmptyProps> = ({
  title = "Xabarlar yo'q",
  hint = 'Birinchi xabarni yuboring',
}) => (
  <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--app-soft)]">
      <MessageCircle size={22} className="text-[var(--app-muted)]" />
    </div>
    <p className="text-[14px] font-black text-[var(--app-text)]">{title}</p>
    <p className="text-[12px] font-medium text-[var(--app-muted)]">{hint}</p>
  </div>
);

export default ChatEmpty;
