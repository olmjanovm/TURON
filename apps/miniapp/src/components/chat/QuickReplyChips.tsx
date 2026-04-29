import React from 'react';

export interface QuickReplyChipsProps {
  items: ReadonlyArray<string>;
  activeValue?: string;
  onPick: (value: string) => void;
}

export const QuickReplyChips: React.FC<QuickReplyChipsProps> = ({ items, activeValue, onPick }) => (
  <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
    {items.map((item) => {
      const active = activeValue === item;
      return (
        <button
          key={item}
          type="button"
          onClick={() => onPick(item)}
          className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] font-black transition-all active:scale-95 ${
            active
              ? 'bg-indigo-600 text-white'
              : 'bg-[var(--app-soft)] text-[var(--app-text)] hover:opacity-80'
          }`}
        >
          {item}
        </button>
      );
    })}
  </div>
);

export default QuickReplyChips;
