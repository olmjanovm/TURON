'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { initTelegram, getInitData, getWebApp, isTelegramEnvironment } from '@/lib/telegram';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';

/**
 * Deep-link ishlovi (auth'dan keyin — cookie o'rnatilgan bo'lishi uchun):
 *  - ?guard=1  → Guard Mode: kutilayotgan VIP join so'rovini tasdiqlaydi.
 *  - startapp=product_<id> (inline natija deep-link) → mahsulot sahifasiga.
 */
function handleDeepLink(router: ReturnType<typeof useRouter>) {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('guard') === '1') {
      void apiFetch('/api/guard/approve', { method: 'POST' }).catch(() => {});
    }
    const startParam = (getWebApp()?.initDataUnsafe as { start_param?: string } | undefined)?.start_param;
    if (startParam?.startsWith('product_')) {
      const id = startParam.slice('product_'.length);
      if (id) router.replace(`/product/${id}`);
    }
  } catch {
    /* deep-link best-effort */
  }
}

/**
 * FAZA A2 — auth bootstrap.
 * Mount'da: Telegram init -> initData -> POST /api/auth/telegram -> cookie + user.
 * SSR'da hech narsa qilmaydi (barchasi useEffect ichida, client'da).
 */
export function TelegramAuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setStatus = useAuthStore((s) => s.setStatus);
  const setError = useAuthStore((s) => s.setError);
  const router = useRouter();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    initTelegram();

    const initData = getInitData();

    if (!initData) {
      // Telegram tashqarisida (oddiy brauzer / dev) — auth o'tkazib yuboriladi.
      if (!isTelegramEnvironment()) {
        setStatus('idle');
        return;
      }
      setError('Telegram ma‘lumotlari topilmadi. Ilovani Telegram orqali oching.');
      return;
    }

    setStatus('authenticating');
    apiFetch<{ user: AuthUser }>('/api/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    })
      .then(({ user }) => {
        setUser(user);
        handleDeepLink(router); // auth'dan keyin: guard tasdiqlash + inline product deep-link
      })
      .catch((err) => {
        const message =
          err instanceof ApiError ? err.message : 'Kirishda xatolik yuz berdi';
        setError(message);
      });
  }, [setUser, setStatus, setError, router]);

  return <>{children}</>;
}
