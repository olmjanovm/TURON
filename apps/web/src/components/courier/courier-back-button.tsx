'use client';

import { useTelegramBackButton } from '@/hooks/use-telegram-back-button';

/**
 * Courier uchun Telegram BackButton boshqaruvi.
 * Home = /courier (u yerda yashirin, faqat Close). Boshqa har qanday courier
 * sahifasida yuqori-chapda "ortga" tugmasi → 1 qadam orqaga. Hech narsa render qilmaydi.
 */
export function CourierBackButton(): null {
  useTelegramBackButton('/courier');
  return null;
}
