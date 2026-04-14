import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useTelegram } from '../../hooks/useTelegram';
import { useAuthStore } from '../../store/useAuthStore';
import { normalizeRole, resolveRoleEntryRedirect } from '../../features/auth/roleRouting';
import { ensureTelegramMiniAppFullscreen } from '../../lib/telegramMiniApp';
import { ErrorStateCard, LoadingScreen } from '../ui/FeedbackStates';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';
const MIN_SPLASH_MS = 2_500;
const AUTH_TIMEOUT_MS = 8_000;
const HARD_TIMEOUT_MS = 13_000;

async function fetchPublicJson<T>(url: string): Promise<T> {
  const { data } = await axios.get<T>(url, { timeout: 10_000 });
  return data;
}

async function doAuthRequest(
  initDataStr: string,
  signal: AbortSignal,
): Promise<{ user: any; token: string }> {
  const { data } = await axios.post(
    `${API_URL}/auth/telegram`,
    { initData: initDataStr },
    { timeout: AUTH_TIMEOUT_MS, signal },
  );
  return data;
}

async function resolveInitData(
  initData: string | undefined,
  signal: AbortSignal,
): Promise<string | null> {
  if (initData) return initData;

  return new Promise<string | null>((resolve) => {
    let tries = 16;

    const poll = () => {
      if (signal.aborted) {
        resolve(null);
        return;
      }

      const freshInitData = window.Telegram?.WebApp?.initData;

      if (freshInitData) {
        resolve(freshInitData);
        return;
      }

      tries -= 1;

      if (tries <= 0) {
        resolve(null);
        return;
      }

      window.setTimeout(poll, 250);
    };

    poll();
  });
}

function isAbortLikeError(err: unknown) {
  return err instanceof Error && (err.name === 'AbortError' || err.message === 'aborted');
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('aborted'));
      return;
    }

    let timer: number | undefined;
    const onAbort = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      reject(new Error('aborted'));
    };

    timer = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
  signal: AbortSignal,
): Promise<T> {
  let timer: number | undefined;
  let onAbort: (() => void) | undefined;

  const timeout = new Promise<never>((_, reject) => {
    if (signal.aborted) {
      reject(new Error('aborted'));
      return;
    }

    timer = window.setTimeout(() => reject(new Error(message)), ms);
    onAbort = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      reject(new Error('aborted'));
    };

    signal.addEventListener('abort', onAbort, { once: true });
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) window.clearTimeout(timer);
    if (onAbort) signal.removeEventListener('abort', onAbort);
  }
}

function hasCachedAuth() {
  const state = useAuthStore.getState();
  return state.isAuthenticated && !!state.user && !!state.token;
}

export const AppBootstrapGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { initData } = useTelegram();
  const { setAuth, user, isAuthenticated, token } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const hadCachedAuthRef = useRef(isAuthenticated && !!user && !!token);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    hadCachedAuthRef.current = hasCachedAuth();
    setReady(false);
    setError(null);
    ensureTelegramMiniAppFullscreen();

    const prefetchMenu = () => {
      void Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: ['menu', 'categories'],
          queryFn: () => fetchPublicJson(`${API_URL}/menu/categories`),
          staleTime: 5 * 60_000,
        }),
        queryClient.prefetchQuery({
          queryKey: ['menu', 'products'],
          queryFn: () => fetchPublicJson(`${API_URL}/menu/products`),
          staleTime: 5 * 60_000,
        }),
      ]);
    };

    const authenticate = async () => {
      const id = await resolveInitData(initData, signal);

      if (signal.aborted) return;

      if (!id) {
        if (hasCachedAuth() || hadCachedAuthRef.current) return;
        throw new Error('Telegram muhiti topilmadi. Bot orqali kiring.');
      }

      try {
        const result = await doAuthRequest(id, signal);
        if (signal.aborted) return;

        const role = normalizeRole(result.user?.role);
        if (!role) throw new Error("Foydalanuvchi roli qo'llab-quvvatlanmaydi");

        setAuth({ ...result.user, role }, result.token);
      } catch (err) {
        if (signal.aborted || isAbortLikeError(err)) throw err;
        if (hasCachedAuth() || hadCachedAuthRef.current) return;
        throw err;
      }
    };

    const bootstrap = async () => {
      prefetchMenu();

      await Promise.all([
        withTimeout(
          authenticate(),
          HARD_TIMEOUT_MS,
          "Ulanish vaqti tugadi. Internetni tekshirib, qayta urining.",
          signal,
        ),
        wait(MIN_SPLASH_MS, signal),
      ]);

      if (!signal.aborted) {
        ensureTelegramMiniAppFullscreen();
        setReady(true);
      }
    };

    void bootstrap().catch((err: Error) => {
      if (!signal.aborted && !isAbortLikeError(err)) {
        setError(err.message || 'Tizimga ulanishda xato yuz berdi.');
      }
    });

    return () => controller.abort();
    // We intentionally run this once per retry. resolveInitData polls the Telegram WebApp object directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);

  useEffect(() => {
    if (!ready || error || !isAuthenticated || !user) return;

    const role = normalizeRole(user.role);

    if (!role) {
      setError("Foydalanuvchi roli noto'g'ri.");
      return;
    }

    const redirect = resolveRoleEntryRedirect(role, location.pathname);

    if (redirect && redirect !== location.pathname) {
      navigate(redirect, { replace: true });
    }
  }, [ready, error, isAuthenticated, user, location.pathname, navigate]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <ErrorStateCard
          title="Xato"
          message={error}
          onRetry={() => {
            setReady(false);
            setError(null);
            setRetryKey((k) => k + 1);
          }}
        />
      </div>
    );
  }

  if (!ready) return <LoadingScreen />;

  return <>{children}</>;
};
