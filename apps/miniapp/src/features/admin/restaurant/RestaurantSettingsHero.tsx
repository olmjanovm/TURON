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
    <section className="adminx-zone-hero adminx-panel adminx-restaurant-hero p-4 md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="adminx-kicker text-[rgba(255,250,240,0.58)]">Restoran sozlamalari</p>
          <h2 className="mt-1.5 text-[30px] font-black tracking-[-0.05em] text-white">{settings.name || 'Turon Kafe'}</h2>
          <p className="mt-2.5 max-w-[280px] text-[13px] font-semibold leading-5 text-white/72">{settings.addressText}</p>
        </div>
        <div className="adminx-chip min-h-8 border-white/10 bg-white/8 px-3 text-[10px] text-white/86">
          <Store size={14} />
          {isOpen ? 'Ochiq' : 'Yopiq'}
        </div>
      </div>

      <div className="mt-4 grid gap-2.5 md:grid-cols-3">
        <div className="rounded-[18px] border border-white/8 bg-white/8 p-3.5 backdrop-blur-sm">
          <Phone size={15} className="text-[#ffd881]" />
          <p className="mt-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/58">Telefon</p>
          <p className="mt-1.5 text-[13px] font-bold text-white">{formatUzbekPhone(settings.phone) || 'Kiritilmagan'}</p>
        </div>
        <div className="rounded-[18px] border border-white/8 bg-white/8 p-3.5 backdrop-blur-sm">
          <MapPinned size={15} className="text-[#ffd881]" />
          <p className="mt-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/58">Koordinata</p>
          <p className="mt-1.5 text-[13px] font-bold text-white">{settings.latitude.toFixed(4)}, {settings.longitude.toFixed(4)}</p>
        </div>
        <div className="rounded-[18px] border border-white/8 bg-white/8 p-3.5 backdrop-blur-sm">
          <Clock3 size={15} className="text-[#ffd881]" />
          <p className="mt-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/58">Bugun</p>
          <p className="mt-1.5 text-[13px] font-bold text-white">{formatTodaySummary(status)}</p>
        </div>
      </div>
    </section>
  );
}
