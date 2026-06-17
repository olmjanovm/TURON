'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getWebApp, haptic } from '@/lib/telegram';

/**
 * Telegram native BackButton'ni route'ga qarab boshqaradi (UMUMIY — 3 lane ham ishlatadi).
 *
 * - **Home** (`homePath`) sahifasida: BackButton YASHIRINADI → faqat default Close qoladi.
 * - **Boshqa har qanday** sahifada: BackButton KO'RINADI (yuqori-chapda) → bosilganda
 *   1 qadam orqaga (`router.back()`).
 *
 * Telegram'da yo'q (oddiy brauzer / eski klient) bo'lsa — no-op (xavfsiz).
 *
 * `homePath` bitta yo'l yoki yo'llar ro'yxati bo'lishi mumkin (masalan customer'da
 * `['/', '/customer']` — chunki bot `/customer`ni ochadi, next.config uni `/`ga rewrite qiladi).
 *
 * Har lane o'z layout'ida BIR MARTA chaqiradi:
 *   useTelegramBackButton('/admin/dashboard')   // admin
 *   useTelegramBackButton(['/', '/customer'])    // customer
 *   useTelegramBackButton(['/courier'])          // courier
 */
export function useTelegramBackButton(homePath: string | string[]): void {
  const pathname = usePathname();
  const router = useRouter();
  // Barqaror kalit — inline array har render'da yangi ref bo'lib effect'ni qayta ishga
  // tushirmasligi uchun.
  const homeKey = Array.isArray(homePath) ? homePath.join('|') : homePath;

  useEffect(() => {
    const bb = getWebApp()?.BackButton;
    if (!bb) return;

    const homes = homeKey.split('|');
    const isHome = homes.includes(pathname);

    const onClick = () => {
      haptic.select();
      router.back();
    };

    if (isHome) {
      bb.hide?.();
    } else {
      bb.show?.();
      bb.onClick?.(onClick);
    }

    return () => {
      // Har route o'zgarishida eski handler'ni olib tashlaymiz (leak/dubl bo'lmasin)
      bb.offClick?.(onClick);
    };
  }, [pathname, homeKey, router]);
}
