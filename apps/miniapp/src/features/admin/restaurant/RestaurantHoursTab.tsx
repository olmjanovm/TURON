import React from 'react';
import { CalendarClock, Circle } from 'lucide-react';
import { dayLabels, dayOrder, type DayKey, type RestaurantSettingsModel, type WorkingHoursDay } from './restaurantSettings.types';
import { getTodayKey } from './restaurantSettings.utils';

interface Props {
  draft: RestaurantSettingsModel;
  onChange: (patch: Partial<RestaurantSettingsModel>) => void;
}

export function RestaurantHoursTab({ draft, onChange }: Props) {
  const todayKey = getTodayKey();
  const allOpen = dayOrder.every((day) => !draft.workingHours[day].closed);

  const updateDay = (day: DayKey, patch: Partial<WorkingHoursDay>) => {
    onChange({ workingHours: { ...draft.workingHours, [day]: { ...draft.workingHours[day], ...patch } } });
  };

  return (
    <section className="adminx-tab-panel space-y-3">
      <div className="adminx-hours-card adminx-restaurant-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="adminx-kicker text-[var(--adminx-color-faint)]">Jadval</p>
            <h3 className="mt-1.5 text-[22px] font-black tracking-[-0.04em] text-[var(--adminx-color-ink)]">Ish vaqti</h3>
          </div>
          <button type="button" onClick={() => {
            const nextClosed = allOpen;
            const workingHours = { ...draft.workingHours };
            dayOrder.forEach((day) => { workingHours[day] = { ...workingHours[day], closed: nextClosed }; });
            onChange({ workingHours });
          }} className="adminx-chip min-h-8 border-[rgba(245,166,35,0.18)] bg-[var(--adminx-color-primary-soft)] px-3 text-[10px] text-[var(--adminx-color-primary-dark)]">
            <CalendarClock size={14} />
            Barcha kunlar
          </button>
        </div>
      </div>

      <div className="adminx-hours-list adminx-restaurant-hours-list">
        {dayOrder.map((day) => {
          const item = draft.workingHours[day];
          const isToday = day === todayKey;
          return (
            <div key={day} className="adminx-hour-row adminx-restaurant-hour-row" data-today={isToday ? 'true' : 'false'} data-closed={item.closed ? 'true' : 'false'}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-black text-[var(--adminx-color-ink)]">{dayLabels[day]}</p>
                    {isToday ? <span className="adminx-chip min-h-7 border-[rgba(245,166,35,0.18)] bg-[var(--adminx-color-primary-soft)] px-3 text-[10px] text-[var(--adminx-color-primary-dark)]">Bugun</span> : null}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 text-[13px] font-semibold text-[var(--adminx-color-muted)]">
                    <Circle size={10} fill={item.closed ? '#c8bea9' : '#249f63'} className={item.closed ? 'text-[#c8bea9]' : 'text-[#249f63]'} />
                    {item.closed ? 'Yopiq' : `${item.open} - ${item.close}`}
                  </div>
                </div>
                <button type="button" className="adminx-toggle" data-checked={item.closed ? 'false' : 'true'} onClick={() => updateDay(day, { closed: !item.closed })} aria-label={`${dayLabels[day]} holati`} />
              </div>

              {!item.closed ? (
                <div className="grid grid-cols-2 gap-3">
                  <input type="time" value={item.open} onChange={(event) => updateDay(day, { open: event.target.value })} className="adminx-time adminx-restaurant-time" />
                  <input type="time" value={item.close} onChange={(event) => updateDay(day, { close: event.target.value })} className="adminx-time adminx-restaurant-time" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
