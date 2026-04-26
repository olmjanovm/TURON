import React from 'react';
import { Clock3, MapPinned, Phone, Store } from 'lucide-react';
import type { RestaurantOpenStatusModel, RestaurantSettingsModel } from './restaurantSettings.types';
import { formatTodaySummary, formatUzbekPhone } from './restaurantSettings.utils';

interface Props {
  settings: RestaurantSettingsModel;
  status?: RestaurantOpenStatusModel;
}

export function RestaurantSettingsHero({ settings, status }: Props) {
  const isOpen = status?.isOpen ?? settings.isOpen;

  return (
    <section className="adminx-zone-hero adminx-panel p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="adminx-kicker text-[rgba(255,250,240,0.58)]">Restoran sozlamalari</p>
          <h2 className="mt-2 text-[34px] font-black tracking-[-0.05em] text-white">{settings.name || 'Turon Kafe'}</h2>
          <p className="mt-3 max-w-[280px] text-sm font-semibold leading-6 text-white/72">{settings.addressText}</p>
        </div>
        <div className="adminx-chip border-white/10 bg-white/8 text-white/86">
          <Store size={14} />
          {isOpen ? 'Ochiq' : 'Yopiq'}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-[22px] border border-white/8 bg-white/8 p-4 backdrop-blur-sm">
          <Phone size={16} className="text-[#ffd881]" />
          <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/58">Telefon</p>
          <p className="mt-2 text-sm font-bold text-white">{formatUzbekPhone(settings.phone) || 'Kiritilmagan'}</p>
        </div>
        <div className="rounded-[22px] border border-white/8 bg-white/8 p-4 backdrop-blur-sm">
          <MapPinned size={16} className="text-[#ffd881]" />
          <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/58">Koordinata</p>
          <p className="mt-2 text-sm font-bold text-white">{settings.latitude.toFixed(4)}, {settings.longitude.toFixed(4)}</p>
        </div>
        <div className="rounded-[22px] border border-white/8 bg-white/8 p-4 backdrop-blur-sm">
          <Clock3 size={16} className="text-[#ffd881]" />
          <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-white/58">Bugun</p>
          <p className="mt-2 text-sm font-bold text-white">{formatTodaySummary(status)}</p>
        </div>
      </div>
    </section>
  );
}
