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
      className="adminx-zone-alert flex w-full items-center gap-3 rounded-[20px] border border-[rgba(214,69,69,0.16)] bg-[linear-gradient(180deg,rgba(255,247,246,0.98)_0%,rgba(255,236,233,0.94)_100%)] px-4 py-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.08),0_14px_28px_rgba(214,69,69,0.08)]"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[var(--adminx-color-danger)] text-white shadow-[0_14px_26px_rgba(214,69,69,0.22)]">
        <Siren size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="adminx-kicker text-[var(--adminx-color-danger)]">Diqqat</p>
        <p className="mt-2 text-[16px] font-black leading-tight text-[var(--adminx-color-ink)]">
          {count} ta buyurtma tasdiq kutmoqda
        </p>
      </div>
      <ArrowRight size={18} className="shrink-0 text-[var(--adminx-color-danger)]" />
    </button>
  );
}
