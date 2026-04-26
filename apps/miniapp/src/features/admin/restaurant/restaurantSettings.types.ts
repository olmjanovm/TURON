export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type RestaurantTabKey = 'basic' | 'address' | 'hours' | 'status';
export type RestaurantCloseReason = 'lunch_break' | 'maintenance' | 'holiday' | 'manual';

export interface WorkingHoursDay {
  open: string;
  close: string;
  closed: boolean;
}

export type WorkingHours = Record<DayKey, WorkingHoursDay>;

export interface RestaurantSettingsModel {
  name: string;
  phone: string;
  addressText: string;
  longitude: number;
  latitude: number;
  workingHours: WorkingHours;
  isOpen: boolean;
  autoSchedule: boolean;
  logoUrl?: string | null;
  closeReason?: RestaurantCloseReason | null;
  autoReopenAt?: string | null;
}

export interface RestaurantOpenStatusModel {
  isOpen: boolean;
  reason: 'manual' | 'schedule' | 'schedule_closed';
  dayKey: DayKey;
  today: WorkingHoursDay;
  nextChange: string | null;
  closeReason?: RestaurantCloseReason | null;
  autoReopenAt?: string | null;
}

export interface RestaurantValidation {
  ok: boolean;
  message: string;
}

export const dayOrder: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const dayLabels: Record<DayKey, string> = {
  mon: 'Dushanba',
  tue: 'Seshanba',
  wed: 'Chorshanba',
  thu: 'Payshanba',
  fri: 'Juma',
  sat: 'Shanba',
  sun: 'Yakshanba',
};

export const tabLabels: Record<RestaurantTabKey, string> = {
  basic: 'Asosiy',
  address: 'Manzil',
  hours: 'Ish vaqti',
  status: 'Holat',
};

export const closeReasonOptions: Array<{ value: RestaurantCloseReason; label: string }> = [
  { value: 'lunch_break', label: 'Obed' },
  { value: 'maintenance', label: "Ta'mirlash" },
  { value: 'holiday', label: 'Dam olish' },
  { value: 'manual', label: "Qo'lda yopish" },
];
