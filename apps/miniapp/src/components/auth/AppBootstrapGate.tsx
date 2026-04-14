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
/** Hard limit before we abort the TCP connection for new users */
const NEW_USER_HARD_TIMEOUT_MS = 15_000;

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
    { timeout: NEW_USER_HARD_TIMEOUT_MS, signal },
  );
  return data;
}

async function resolveInitData(
  initData: string | undefined,
  signal: AbortSignal,
): Promise<string | null> {
  // Already have initData — return immediately
  if (initData) return initData;

  // Poll window.Telegram.WebApp.initData up to 5 seconds (20 × 250 ms)
  return new Promise<string | null>((resolve) => {
    let tries = 20;

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

function isAbortLikeError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  // Covers browser AbortError, manual 'aborted', and axios CanceledError
  return (
    err.name === 'AbortError' ||
    err.name === 'CanceledError' ||
    err.message === 'aborted' ||
    err.message === 'canceled'
  );
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

function hasCachedAuth(): boolean {
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

    // ── Prefetch public menu data in background ───────────────────────────────
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

    /**
     * Background auth refresh — never blocks the UI, never sets error state.
     * Used for returning users who already have a cached session.
     */
    const refreshInBackground = () => {
      void (async () => {
        try {
          const id = await resolveInitData(initData, signal);
          if (!id || signal.aborted) return;

          const result = await doAuthRequest(id, signal);
          if (signal.aborted) return;

          const role = normalizeRole(result.user?.role);
          if (role) setAuth({ ...result.user, role }, result.token);
        } catch {
          // Silent fail — cached session remains valid for the duration of this visit
        }
      })();
    };

    /**
     * Blocking auth for first-time users.
     *
     * Creates a dedicated AbortController so we can force-cancel the TCP
     * connection on timeout (axios's built-in timeout only starts after the
     * connection is established, so a hanging TCP SYN can freeze the app
     * well past the configured timeout).
     *
     * Throws a human-readable Error on failure so the caller can show it.
     */
    const authenticateBlocking = async (): Promise<void> => {
      const authCtl = new AbortController();
      const authSignal = authCtl.signal;

      // If the component unmounts, also abort the in-flight request
      const onComponentAbort = () => authCtl.abort();
      signal.addEventListener('abort', onComponentAbort, { once: true });

      // Track whether *our* timer caused the abort (vs component unmount)
      let timedOutByUs = false;
      const hardTimer = window.setTimeout(() => {
        timedOutByUs = true;
        authCtl.abort();
      }, NEW_USER_HARD_TIMEOUT_MS);

      try {
        const id = await resolveInitData(initData, authSignal);

        if (signal.aborted) return; // component unmounted — no error

        if (!id) {
          throw new Error('Telegram muhiti topilmadi. Bot orqali kiring.');
        }

        const result = await doAuthRequest(id, authSignal);

        if (signal.aborted) return; // component unmounted — no error

        const role = normalizeRole(result.user?.role);
        if (!role) throw new Error("Foydalanuvchi roli qo'llab-quvvatlanmaydi");

        setAuth({ ...result.user, role }, result.token);
      } catch (err) {
        if (signal.aborted) return; // component unmounted — swallow silently

        // Our timer fired → translate the CanceledError to a user-visible message
        if (timedOutByUs && isAbortLikeError(err)) {
          throw new Error("Ulanish vaqti tugadi. Internetni tekshirib, qayta urining.");
        }

        throw err; // Network / server / role error — let the caller show it
      } finally {
        window.clearTimeout(hardTimer);
        signal.removeEventListener('abort', onComponentAbort);
      }
    };

    // ── Main bootstrap ────────────────────────────────────────────────────────
    const bootstrap = async () => {
      if (hasCachedAuth() || hadCachedAuthRef.current) {
        // Returning user: show app after splash, silently refresh auth
        refreshInBackground();
        await wait(MIN_SPLASH_MS, signal);
      } else {
        // First-time user: must authenticate before showing app
        await Promise.all([
          authenticateBlocking(),
          wait(MIN_SPLASH_MS, signal),
        ]);
      }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey]);

  // ── Role-based redirect after ready ──────────────────────────────────────────
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
