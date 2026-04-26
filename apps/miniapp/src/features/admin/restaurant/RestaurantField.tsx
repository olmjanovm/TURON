import React from 'react';

interface Props {
  label: string;
  filled: boolean;
  error?: string | null;
  hint?: string;
  children: React.ReactNode;
}

export function RestaurantField({ label, filled, error, hint, children }: Props) {
  return (
    <div className="adminx-field" data-filled={filled ? 'true' : 'false'}>
      {children}
      <span className="adminx-floating-label">{label}</span>
      {error ? <p className="text-sm font-semibold text-[var(--adminx-color-danger)]">{error}</p> : null}
      {hint ? <p className="text-sm font-semibold text-[var(--adminx-color-muted)]">{hint}</p> : null}
    </div>
  );
}
