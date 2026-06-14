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
 * Har lane o'z layout'ida BIR MARTA chaqiradi:
 *   useTelegramBackButton('/admin/dashboard') // admin
 *   useTelegramBackButton('/')                // customer
 *   useTelegramBackButton('/courier')         // courier
 */
export function useTelegramBackButton(homePath: string): void {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const bb = getWebApp()?.BackButton;
    if (!bb) return;

    const isHome = pathname === homePath;

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
  }, [pathname, homePath, router]);
}
