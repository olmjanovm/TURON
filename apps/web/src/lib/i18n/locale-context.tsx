'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { LOCALES, TRANSLATIONS, type Locale, type TranslationKey } from './translations';

const LOCALE_COOKIE = 'turon-locale';
const LOCALE_STORAGE = 'turon-locale';

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey, fallback?: string) => string;
}

const Ctx = createContext<LocaleCtx | null>(null);

function readInitial(): Locale {
  if (typeof window === 'undefined') return 'uz';
  try {
    const fromStorage = window.localStorage.getItem(LOCALE_STORAGE);
    if (fromStorage && (LOCALES as readonly string[]).includes(fromStorage)) {
      return fromStorage as Locale;
    }
    const m = document.cookie.match(/(?:^|; )turon-locale=([^;]+)/);
    if (m && (LOCALES as readonly string[]).includes(m[1])) return m[1] as Locale;
    const tg = (window as Window & { Telegram?: { WebApp?: { initDataUnsafe?: { user?: { language_code?: string } } } } })
      .Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
    if (tg === 'ru') return 'ru';
  } catch {/* ignore */}
  return 'uz';
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('uz');

  useEffect(() => {
    setLocaleState(readInitial());
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(LOCALE_STORAGE, l);
      document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      document.documentElement.lang = l.startsWith('uz') ? 'uz' : 'ru';
    } catch {/* ignore */}
  }, []);

  const t = useCallback(
    (key: TranslationKey, fallback?: string): string => {
      const dict = TRANSLATIONS[locale] as Record<string, string>;
      return dict[key] ?? fallback ?? (TRANSLATIONS.uz as Record<string, string>)[key] ?? key;
    },
    [locale],
  );

  return <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>;
}

export function useLocale() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLocale must be used inside <LocaleProvider>');
  return ctx;
}

/** Compact alias — usage: const t = useT(); t('cart.title') */
export function useT() {
  return useContext(Ctx)?.t ?? ((k: string) => k);
}
