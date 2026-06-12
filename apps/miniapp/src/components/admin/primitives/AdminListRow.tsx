import React from 'react';
import { ChevronRight } from 'lucide-react';

type Props = {
  leading?: React.ReactNode;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  showChevron?: boolean;
  className?: string;
};

export function AdminListRow({
  leading,
  primary,
  secondary,
  trailing,
  onClick,
  showChevron,
  className = '',
}: Props) {
  const clickable = Boolean(onClick);
  return (
    <div
      className={`admin-list-row ${className}`}
      data-clickable={clickable ? 'true' : undefined}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {leading ? <div className="flex-shrink-0">{leading}</div> : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="text-sm font-semibold text-slate-900 truncate">{primary}</div>
        {secondary ? (
          <div className="mt-0.5 text-[11px] text-slate-500 truncate">{secondary}</div>
        ) : null}
      </div>
      {trailing ? <div className="flex-shrink-0">{trailing}</div> : null}
      {showChevron ? (
        <ChevronRight size={16} className="flex-shrink-0 text-slate-400" />
      ) : null}
    </div>
  );
}
