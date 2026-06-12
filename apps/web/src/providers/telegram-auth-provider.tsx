'use client';

import { useEffect, useRef } from 'react';
import { initTelegram, getInitData, isTelegramEnvironment } from '@/lib/telegram';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useAuthStore, type AuthUser } from '@/stores/auth-store';

/**
 * FAZA A2 — auth bootstrap.
 * Mount'da: Telegram init -> initData -> POST /api/auth/telegram -> cookie + user.
 * SSR'da hech narsa qilmaydi (barchasi useEffect ichida, client'da).
 */
export function TelegramAuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setStatus = useAuthStore((s) => s.setStatus);
  const setError = useAuthStore((s) => s.setError);
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
      .then(({ user }) => setUser(user))
      .catch((err) => {
        const message =
          err instanceof ApiError ? err.message : 'Kirishda xatolik yuz berdi';
        setError(message);
      });
  }, [setUser, setStatus, setError]);

  return <>{children}</>;
}
