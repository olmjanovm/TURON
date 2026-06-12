import React from 'react';

type Props = {
  label: string;
  value: React.ReactNode;
  suffix?: string;
  onClick?: () => void;
  className?: string;
};

export function AdminStatTile({ label, value, suffix, onClick, className = '' }: Props) {
  const clickable = Boolean(onClick);
  return (
    <div
      className={`admin-stat-tile ${className}`}
      data-clickable={clickable ? 'true' : undefined}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <span className="admin-stat-tile-label">{label}</span>
      <span className="admin-stat-tile-value">
        {value}
        {suffix ? <span className="admin-stat-tile-suffix">{suffix}</span> : null}
      </span>
    </div>
  );
}
