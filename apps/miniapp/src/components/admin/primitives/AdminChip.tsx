import React from 'react';

type Props = {
  label: string;
  active?: boolean;
  count?: number;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
};

export function AdminChip({ label, active, count, onClick, icon, className = '' }: Props) {
  return (
    <button
      type="button"
      className={`admin-chip ${className}`}
      data-active={active ? 'true' : undefined}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
      {typeof count === 'number' ? <span className="admin-chip-count">{count}</span> : null}
    </button>
  );
}
