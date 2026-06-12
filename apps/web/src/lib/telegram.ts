/**
 * FAZA A2 — Telegram WebApp SSR-safe wrapper.
 *
 * window.Telegram serverda MAVJUD EMAS. Shu sababli har bir chaqiruv
 * `getWebApp()` guard orqali o'tadi va faqat brauzerda (client) ishlaydi.
 * SSR/RSC paytida hech bir funksiya crash bermaydi — barchasi no-op qaytaradi.
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type HapticNotification = 'error' | 'success' | 'warning';

type TelegramWebApp = {
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
  initData?: string;
  initDataUnsafe?: { user?: { id?: number; language_code?: string } };
  version?: string;
  platform?: string;
  colorScheme?: 'light' | 'dark';
  themeParams?: Record<string, string>;
  viewportHeight?: number;
  viewportStableHeight?: number;
  isExpanded?: boolean;
  disableVerticalSwipes?: () => void;
  enableClosingConfirmation?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  onEvent?: (event: string, handler: () => void) => void;
  offEvent?: (event: string, handler: () => void) => void;
  HapticFeedback?: {
    impactOccurred?: (style: HapticStyle) => void;
    notificationOccurred?: (type: HapticNotification) => void;
    selectionChanged?: () => void;
  };
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

/** Brauzerdami? (SSR guard) */
export const isBrowser = (): boolean => typeof window !== 'undefined';

/** Telegram WebApp obyektini xavfsiz oladi (server'da undefined). */
export function getWebApp(): TelegramWebApp | undefined {
  if (!isBrowser()) return undefined;
  return window.Telegram?.WebApp;
}

/** Telegram ichida ochilganmi? */
export function isTelegramEnvironment(): boolean {
  const wa = getWebApp();
  return Boolean(wa && typeof wa.initData === 'string' && wa.initData.length > 0);
}

/** Auth uchun raw initData satrini qaytaradi (signature verify backendda). */
export function getInitData(): string | null {
  const wa = getWebApp();
  const raw = wa?.initData?.trim();
  return raw && raw.length > 0 ? raw : null;
}

function safeCall(fn: (() => void) | undefined): void {
  try {
    fn?.();
  } catch {
    // Eski Telegram klientlar ba'zi API'larni qo'llab-quvvatlamaydi — best-effort.
  }
}

/**
 * Mini-app'ni ishga tushiradi: ready() + expand() + safe-area sync.
 * Faqat client'da chaqiriladi (useEffect ichidan).
 */
export function initTelegram(): void {
  const wa = getWebApp();
  if (!wa) return;

  safeCall(wa.ready);
  safeCall(wa.expand);
  safeCall(wa.disableVerticalSwipes);

  document.documentElement.dataset.tgPlatform = (wa.platform || 'unknown').toLowerCase();
  document.documentElement.dataset.tgColorScheme = wa.colorScheme || 'light';

  syncSafeArea();
  const onViewport = () => syncSafeArea();
  wa.onEvent?.('viewportChanged', onViewport);
  wa.onEvent?.('themeChanged', onViewport);
}

/** Telegram viewport balandligini CSS o'zgaruvchilariga yozadi. */
function syncSafeArea(): void {
  const wa = getWebApp();
  if (!wa || !isBrowser()) return;
  const root = document.documentElement;
  if (typeof wa.viewportStableHeight === 'number') {
    root.style.setProperty('--tg-viewport-stable-height', `${wa.viewportStableHeight}px`);
  }
  if (typeof wa.viewportHeight === 'number') {
    root.style.setProperty('--tg-viewport-height', `${wa.viewportHeight}px`);
  }
}

/** Haptik teginish (savatga qo'shish, tugma bosish uchun). */
export const haptic = {
  impact(style: HapticStyle = 'light'): void {
    safeCall(() => getWebApp()?.HapticFeedback?.impactOccurred?.(style));
  },
  notify(type: HapticNotification): void {
    safeCall(() => getWebApp()?.HapticFeedback?.notificationOccurred?.(type));
  },
  select(): void {
    safeCall(() => getWebApp()?.HapticFeedback?.selectionChanged?.());
  },
};

/** Telegram klient tilini qaytaradi (mavjud bo'lsa). */
export function getTelegramLanguage(): string | null {
  return getWebApp()?.initDataUnsafe?.user?.language_code ?? null;
}
