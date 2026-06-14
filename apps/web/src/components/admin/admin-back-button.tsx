'use client';

import { useTelegramBackButton } from '@/hooks/use-telegram-back-button';

/**
 * Admin uchun Telegram BackButton boshqaruvi.
 * Home = /admin/dashboard (u yerda yashirin, faqat Close). Boshqa har qanday admin
 * sahifasida yuqori-chapda "ortga" tugmasi → 1 qadam orqaga. Hech narsa render qilmaydi.
 */
export function AdminBackButton(): null {
  useTelegramBackButton('/admin/dashboard');
  return null;
}
