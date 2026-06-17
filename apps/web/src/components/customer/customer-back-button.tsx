'use client';

import { useTelegramBackButton } from '@/hooks/use-telegram-back-button';

/**
 * Customer uchun Telegram BackButton boshqaruvi.
 * Home = `/` (u yerda yashirin, faqat default Close qoladi). Boshqa har qanday
 * customer sahifasida yuqori-chapda "ortga" tugmasi → 1 qadam orqaga. Render: null.
 */
export function CustomerBackButton(): null {
  useTelegramBackButton('/');
  return null;
}
