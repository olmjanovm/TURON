import { prisma } from '../lib/prisma.js';
import { RESTAURANT_COORDINATES } from '@turon/shared';

export interface WorkingHoursDay {
  open: string;  // "HH:MM"
  close: string; // "HH:MM"
  closed: boolean;
}

export interface WorkingHours {
  mon: WorkingHoursDay;
  tue: WorkingHoursDay;
  wed: WorkingHoursDay;
  thu: WorkingHoursDay;
  fri: WorkingHoursDay;
  sat: WorkingHoursDay;
  sun: WorkingHoursDay;
}

export interface RestaurantSettings {
  name: string;
  phone: string;
  addressText: string;
  longitude: number;
  latitude: number;
  workingHours: WorkingHours;
  isOpen: boolean;
  autoSchedule: boolean;
}

const DEFAULT_WORKING_HOURS: WorkingHours = {
  mon: { open: '09:00', close: '22:00', closed: false },
  tue: { open: '09:00', close: '22:00', closed: false },
  wed: { open: '09:00', close: '22:00', closed: false },
  thu: { open: '09:00', close: '22:00', closed: false },
  fri: { open: '09:00', close: '22:00', closed: false },
  sat: { open: '10:00', close: '22:00', closed: false },
  sun: { open: '10:00', close: '21:00', closed: false },
};

const DEFAULTS: RestaurantSettings = {
  name: RESTAURANT_COORDINATES.name,
  phone: '',
  addressText: RESTAURANT_COORDINATES.address,
  longitude: RESTAURANT_COORDINATES.lng,
  latitude: RESTAURANT_COORDINATES.lat,
  workingHours: DEFAULT_WORKING_HOURS,
  isOpen: true,
  autoSchedule: true,
};

async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.restaurantSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

async function setSetting(key: string, value: string, dataType: string, updatedById?: string) {
  await prisma.restaurantSetting.upsert({
    where: { key },
    update: { value, dataType, updatedById: updatedById ?? null },
    create: { key, value, dataType, updatedById: updatedById ?? null },
  });
}

export async function getRestaurantSettings(): Promise<RestaurantSettings> {
  const [name, phone, addressText, longitude, latitude, workingHoursRaw, isOpenRaw, autoScheduleRaw] =
    await Promise.all([
      getSetting('name'),
      getSetting('phone'),
      getSetting('address_text'),
      getSetting('longitude'),
      getSetting('latitude'),
      getSetting('working_hours'),
      getSetting('is_open'),
      getSetting('auto_schedule'),
    ]);

  let workingHours = DEFAULTS.workingHours;
  if (workingHoursRaw) {
    try { workingHours = JSON.parse(workingHoursRaw); } catch {}
  }

  return {
    name: name ?? DEFAULTS.name,
    phone: phone ?? DEFAULTS.phone,
    addressText: addressText ?? DEFAULTS.addressText,
    longitude: longitude ? parseFloat(longitude) : DEFAULTS.longitude,
    latitude: latitude ? parseFloat(latitude) : DEFAULTS.latitude,
    workingHours,
    isOpen: isOpenRaw !== null ? isOpenRaw === 'true' : DEFAULTS.isOpen,
    autoSchedule: autoScheduleRaw !== null ? autoScheduleRaw === 'true' : DEFAULTS.autoSchedule,
  };
}

export interface PatchRestaurantSettings {
  name?: string;
  phone?: string;
  addressText?: string;
  longitude?: number;
  latitude?: number;
  workingHours?: WorkingHours;
  isOpen?: boolean;
  autoSchedule?: boolean;
}

export async function patchRestaurantSettings(
  patch: PatchRestaurantSettings,
  updatedById?: string,
) {
  const tasks: Promise<void>[] = [];

  if (patch.name !== undefined)
    tasks.push(setSetting('name', patch.name, 'string', updatedById));
  if (patch.phone !== undefined)
    tasks.push(setSetting('phone', patch.phone, 'string', updatedById));
  if (patch.addressText !== undefined)
    tasks.push(setSetting('address_text', patch.addressText, 'string', updatedById));
  if (patch.longitude !== undefined)
    tasks.push(setSetting('longitude', String(patch.longitude), 'number', updatedById));
  if (patch.latitude !== undefined)
    tasks.push(setSetting('latitude', String(patch.latitude), 'number', updatedById));
  if (patch.workingHours !== undefined)
    tasks.push(setSetting('working_hours', JSON.stringify(patch.workingHours), 'json', updatedById));
  if (patch.isOpen !== undefined)
    tasks.push(setSetting('is_open', String(patch.isOpen), 'boolean', updatedById));
  if (patch.autoSchedule !== undefined)
    tasks.push(setSetting('auto_schedule', String(patch.autoSchedule), 'boolean', updatedById));

  await Promise.all(tasks);
  return getRestaurantSettings();
}

/** Returns true if the restaurant is currently open (respects auto_schedule). */
export async function isRestaurantOpen(): Promise<boolean> {
  const settings = await getRestaurantSettings();

  if (!settings.autoSchedule) {
    return settings.isOpen;
  }

  // Auto-schedule: check current day/time against working hours (Tashkent = UTC+5)
  const now = new Date();
  const utcOffset = 5 * 60; // minutes
  const localMs = now.getTime() + utcOffset * 60 * 1000;
  const local = new Date(localMs);

  const dayMap: Record<number, keyof WorkingHours> = {
    0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
  };
  const dayKey = dayMap[local.getUTCDay()];
  const dayHours = settings.workingHours[dayKey];

  if (dayHours.closed) return false;

  const [openH, openM] = dayHours.open.split(':').map(Number);
  const [closeH, closeM] = dayHours.close.split(':').map(Number);
  const currentMin = local.getUTCHours() * 60 + local.getUTCMinutes();
  const openMin = openH * 60 + openM;
  const closeMin = closeH * 60 + closeM;

  return currentMin >= openMin && currentMin < closeMin;
}
