import { dayLabels, type DayKey, type RestaurantOpenStatusModel, type RestaurantSettingsModel, type RestaurantValidation, type WorkingHours } from './restaurantSettings.types';

export const defaultWorkingHours: WorkingHours = {
  mon: { open: '09:00', close: '22:00', closed: false },
  tue: { open: '09:00', close: '22:00', closed: false },
  wed: { open: '09:00', close: '22:00', closed: false },
  thu: { open: '09:00', close: '22:00', closed: false },
  fri: { open: '09:00', close: '23:00', closed: false },
  sat: { open: '10:00', close: '23:00', closed: false },
  sun: { open: '10:00', close: '21:00', closed: false },
};

const dayIndexMap: Record<number, DayKey> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

export const fallbackRestaurantSettings: RestaurantSettingsModel = {
  name: 'Turon Kafe',
  phone: '',
  addressText: 'Yangi Sergeli ko\'chasi, 11',
  longitude: 69.240562,
  latitude: 41.311081,
  workingHours: defaultWorkingHours,
  isOpen: true,
  autoSchedule: true,
  logoUrl: null,
  closeReason: null,
  autoReopenAt: null,
};

export function normalizeUzbekPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('998')) return `+${digits.slice(0, 12)}`;
  return `+998${digits.slice(0, 9)}`;
}

export function formatUzbekPhone(value: string) {
  const normalized = normalizeUzbekPhone(value);
  const digits = normalized.replace(/\D/g, '');
  if (digits.length !== 12) return value;
  return `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
}

export function isValidUzbekPhone(value: string) {
  return /^\+998\d{9}$/.test(normalizeUzbekPhone(value));
}

export function normalizeRestaurantSettings(value: unknown): RestaurantSettingsModel {
  if (!value || typeof value !== 'object') {
    return fallbackRestaurantSettings;
  }

  const candidate = value as Partial<RestaurantSettingsModel>;
  return {
    ...fallbackRestaurantSettings,
    ...candidate,
    workingHours: {
      ...defaultWorkingHours,
      ...(candidate.workingHours && typeof candidate.workingHours === 'object' ? candidate.workingHours : {}),
    },
  };
}

export function getRestaurantValidation(settings: RestaurantSettingsModel): RestaurantValidation {
  if (settings.name.trim().length < 2) return { ok: false, message: 'Restoran nomi kiritilmagan' };
  if (!isValidUzbekPhone(settings.phone)) return { ok: false, message: 'Telefon raqami noto\'g\'ri' };
  if (settings.addressText.trim().length < 5) return { ok: false, message: 'Manzil to\'liq emas' };
  return { ok: true, message: 'Tayyor' };
}

export function getTodayKey() {
  return dayIndexMap[new Date().getDay()];
}

export function formatTodaySummary(status?: RestaurantOpenStatusModel) {
  if (!status) return 'Holat aniqlanmoqda';
  if (status.today.closed) return `${dayLabels[status.dayKey]} yopiq`;
  return `${dayLabels[status.dayKey]} · ${status.today.open} - ${status.today.close}`;
}

export function createAutoReopenIso(timeValue: string) {
  if (!timeValue) return null;
  const [hours, minutes] = timeValue.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  const now = new Date();
  const candidate = new Date(now);
  candidate.setHours(hours, minutes, 0, 0);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 1);
  }
  return candidate.toISOString();
}

export function formatAutoReopenLabel(value?: string | null) {
  if (!value) return 'Belgilanmagan';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Belgilanmagan';
  return new Intl.DateTimeFormat('uz-UZ', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
