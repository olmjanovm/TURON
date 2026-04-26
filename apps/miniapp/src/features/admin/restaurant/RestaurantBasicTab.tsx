import React from 'react';
import type { RestaurantSettingsModel } from './restaurantSettings.types';
import { RestaurantField } from './RestaurantField';
import { RestaurantLogoUploader } from './RestaurantLogoUploader';
import { formatUzbekPhone } from './restaurantSettings.utils';

interface Props {
  draft: RestaurantSettingsModel;
  onChange: (patch: Partial<RestaurantSettingsModel>) => void;
}

export function RestaurantBasicTab({ draft, onChange }: Props) {
  return (
    <section className="adminx-tab-panel space-y-4">
      <div className="adminx-form-card p-5">
        <p className="adminx-kicker text-[var(--adminx-color-faint)]">Brend ko'rinishi</p>
        <h3 className="mt-2 text-[26px] font-black tracking-[-0.04em] text-[var(--adminx-color-ink)]">Asosiy ma'lumotlar</h3>
        <div className="mt-5">
          <RestaurantLogoUploader logoUrl={draft.logoUrl} onChange={(logoUrl) => onChange({ logoUrl })} />
        </div>
      </div>

      <div className="adminx-form-card grid gap-4 p-5">
        <RestaurantField label="Restoran nomi" filled={draft.name.trim().length > 0}>
          <input
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
            className="adminx-input"
            placeholder=" "
          />
        </RestaurantField>

        <RestaurantField
          label="Telefon"
          filled={draft.phone.trim().length > 0}
          hint={`Ko'rinishi: ${formatUzbekPhone(draft.phone) || '+998 90 123 45 67'}`}
        >
          <input
            value={draft.phone}
            onChange={(event) => onChange({ phone: event.target.value })}
            className="adminx-input"
            inputMode="tel"
            placeholder=" "
          />
        </RestaurantField>
      </div>
    </section>
  );
}
