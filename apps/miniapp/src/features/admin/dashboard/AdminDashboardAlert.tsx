import React from 'react';
import { ArrowRight, Siren } from 'lucide-react';

interface Props {
  count: number;
  onClick: () => void;
}

export function AdminDashboardAlert({ count, onClick }: Props) {
  if (count <= 0) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="adminx-zone-alert adminx-home-alert flex w-full items-center gap-3 text-left"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[var(--adminx-color-danger)] text-white shadow-[0_12px_22px_rgba(214,69,69,0.18)]">
        <Siren size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="adminx-kicker text-[var(--adminx-color-danger)]">Diqqat</p>
        <p className="mt-1 text-[15px] font-black leading-tight text-[var(--adminx-color-ink)]">
          {count} ta buyurtma tasdiq kutmoqda
        </p>
      </div>
      <ArrowRight size={18} className="shrink-0 text-[var(--adminx-color-danger)]" />
    </button>
  );
}
