import React from 'react';
import { Clock3, DoorOpen, Wrench } from 'lucide-react';
import { closeReasonOptions, type RestaurantOpenStatusModel, type RestaurantSettingsModel } from './restaurantSettings.types';
import { createAutoReopenIso, formatAutoReopenLabel } from './restaurantSettings.utils';

interface Props {
  draft: RestaurantSettingsModel;
  status?: RestaurantOpenStatusModel;
  onChange: (patch: Partial<RestaurantSettingsModel>) => void;
}

export function RestaurantStatusTab({ draft, status, onChange }: Props) {
  const isOpen = status?.isOpen ?? draft.isOpen;
  const autoReopenTime = React.useMemo(() => {
    if (!draft.autoReopenAt) return '';
    const date = new Date(draft.autoReopenAt);
    if (Number.isNaN(date.getTime())) return '';
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }, [draft.autoReopenAt]);

  return (
    <section className="adminx-tab-panel space-y-4">
      <div className="adminx-status-hero" data-open={isOpen ? 'true' : 'false'}>
        <p className="adminx-kicker text-[var(--adminx-color-faint)]">Joriy holat</p>
        <h3 className="mt-3 text-[54px] font-black tracking-[-0.08em] text-[var(--adminx-color-ink)]">{isOpen ? 'OCHIQ' : 'YOPIQ'}</h3>
        <p className="mt-3 text-sm font-semibold text-[var(--adminx-color-muted)]">{isOpen ? 'Buyurtma qabul qilinmoqda' : 'Qayta ochish va sababi pastda boshqariladi'}</p>
        <button
          type="button"
          onClick={() => onChange({ isOpen: !draft.isOpen, autoReopenAt: draft.isOpen ? draft.autoReopenAt : null })}
          className="mt-6 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[18px] border border-[rgba(28,18,7,0.08)] bg-white/90 px-5 text-sm font-black uppercase tracking-[0.14em] text-[var(--adminx-color-ink)] shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
        >
          {isOpen ? <Wrench size={18} /> : <DoorOpen size={18} />}
          {isOpen ? 'Yopish' : 'Ochish'}
        </button>
      </div>

      <div className="adminx-status-card space-y-4 p-5">
        <div className="flex items-center justify-between gap-3 rounded-[20px] border border-[rgba(28,18,7,0.08)] bg-white/90 px-4 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <div>
            <p className="text-[16px] font-black text-[var(--adminx-color-ink)]">Jadval bo'yicha boshqarish</p>
            <p className="mt-1 text-sm font-semibold text-[var(--adminx-color-muted)]">Ish vaqtiga qarab avtomatik ochish</p>
          </div>
          <button type="button" className="adminx-toggle" data-checked={draft.autoSchedule ? 'true' : 'false'} onClick={() => onChange({ autoSchedule: !draft.autoSchedule })} />
        </div>

        {!draft.isOpen ? (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              {closeReasonOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onChange({ closeReason: item.value })}
                  className="rounded-[18px] border px-4 py-4 text-left text-sm font-black shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition"
                  style={{
                    borderColor: draft.closeReason === item.value ? 'rgba(245,166,35,0.34)' : 'rgba(28,18,7,0.08)',
                    background: draft.closeReason === item.value ? 'var(--adminx-color-primary-soft)' : 'rgba(255,255,255,0.92)',
                    color: 'var(--adminx-color-ink)',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="rounded-[20px] border border-[rgba(28,18,7,0.08)] bg-white/90 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-2 text-[var(--adminx-color-primary-dark)]">
                <Clock3 size={16} />
                <p className="adminx-kicker">Qayta ochish</p>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-[160px_1fr] md:items-center">
                <input
                  type="time"
                  className="adminx-time"
                  value={autoReopenTime}
                  onChange={(event) => onChange({ autoReopenAt: createAutoReopenIso(event.target.value) })}
                />
                <p className="text-sm font-semibold text-[var(--adminx-color-muted)]">Belgilangan vaqt: {formatAutoReopenLabel(draft.autoReopenAt)}</p>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
