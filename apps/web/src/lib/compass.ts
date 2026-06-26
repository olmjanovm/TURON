'use client';

/**
 * Kompas — qurilma yo'nalishi (heading, gradus 0-360, shimoldan soat strelkasi bo'yicha).
 * Navigatorда xaritani course-up aylantirish uchun (kuryer qayoqqa qarasa — o'sha tomon).
 *
 * ⚠️ MUHIM: oddiy web `deviceorientation` event Telegram WebView'да ISHLAMAYDI.
 * Shuning uchun BIRLAMCHI — Telegram'ning O'Z sensori:
 *   `WebApp.DeviceOrientation.start({ need_absolute: true })` (Bot API 8.0+).
 *   need_absolute=true → GYROSKOP + MAGNITOMETR FUSION (kompas, magnit shimol).
 *   Ruxsatni Telegram O'ZI so'raydi (yagona allov — alohida emas). alpha = RADIAN.
 * Telegram yo'q / eski versiya / sensor fail → oddiy web DeviceOrientation (fallback).
 */
export type CompassHandler = (headingDeg: number) => void;

type TgDeviceOrientation = {
  start: (p: { refresh_rate?: number; need_absolute?: boolean }, cb?: (ok: boolean) => void) => void;
  stop: (cb?: () => void) => void;
  alpha?: number;     // RADIAN, Z o'qi
  absolute?: boolean;
  isStarted?: boolean;
};
type TgWebApp = {
  isVersionAtLeast?: (v: string) => boolean;
  onEvent?: (e: string, cb: () => void) => void;
  offEvent?: (e: string, cb: () => void) => void;
  DeviceOrientation?: TgDeviceOrientation;
};

function getTgWebApp(): TgWebApp | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp ?? null;
}

// alpha (radian, Z o'qi, absolute) → kompas heading (gradus 0-360, shimoldan soat str.).
function alphaRadToHeading(alphaRad: number): number {
  const deg = (alphaRad * 180) / Math.PI;
  return (((360 - deg) % 360) + 360) % 360;
}

export function startCompass(onHeading: CompassHandler): () => void {
  if (typeof window === 'undefined') return () => {};

  // ── 1) TELEGRAM sensori (Bot API 8.0+) — WebView'да yagona ishonchli yo'l ──
  const tg = getTgWebApp();
  if (tg?.DeviceOrientation && typeof tg.onEvent === 'function' && tg.isVersionAtLeast?.('8.0')) {
    let active = true;
    let lastEmit = 0;
    let gotData = false;
    let webStop: (() => void) | null = null;

    const onChanged = () => {
      if (!active) return;
      const dev = tg.DeviceOrientation;
      const a = dev?.alpha;
      if (typeof a !== 'number' || Number.isNaN(a)) return;
      gotData = true;
      // RELATIV orientatsiya (absolute=false) DRIFT qiladi → heading uzluksiz o'sib
      // xaritani CHEKSIZ aylantiradi (spin). Faqat ABSOLUTE (kompas) ishlatamiz.
      if (dev?.absolute === false) return;
      const now = Date.now();
      if (now - lastEmit < 150) return; // ~6-7 Hz (lag uchun yana pasaytirildi)
      lastEmit = now;
      onHeading(alphaRadToHeading(a));
    };
    let failed = false;
    const onFailed = () => { failed = true; };

    tg.onEvent('deviceOrientationChanged', onChanged);
    tg.onEvent?.('deviceOrientationFailed', onFailed);
    try {
      // refresh_rate 200ms (≈5 Hz) — kam yuk (LAG↓); need_absolute → kompas (gyro+magnit).
      tg.DeviceOrientation.start({ refresh_rate: 200, need_absolute: true });
    } catch { failed = true; }

    // Telegram sensori 1.5s'да ishlamasa (fail yoki jim) → web API zaxirasi.
    const fbTimer = window.setTimeout(() => {
      if ((failed || !gotData) && !webStop) webStop = startWebCompass(onHeading);
    }, 1500);

    return () => {
      active = false;
      window.clearTimeout(fbTimer);
      tg.offEvent?.('deviceOrientationChanged', onChanged);
      tg.offEvent?.('deviceOrientationFailed', onFailed);
      try { tg.DeviceOrientation?.stop(); } catch { /* */ }
      webStop?.();
    };
  }

  // ── 2) Web DeviceOrientation (Telegram tashqarisida / eski client) ──
  return startWebCompass(onHeading);
}

/** Oddiy web DeviceOrientation (Telegram tashqarisida ishlaydi; WebView'да odatda yo'q). */
function startWebCompass(onHeading: CompassHandler): () => void {
  if (typeof window === 'undefined') return () => {};
  let active = true;
  let lastEmit = 0;

  const handle = (e: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
    if (!active) return;
    const now = Date.now();
    if (now - lastEmit < 80) return;
    let h: number | null = null;
    if (typeof e.webkitCompassHeading === 'number' && !Number.isNaN(e.webkitCompassHeading)) {
      h = e.webkitCompassHeading; // iOS — haqiqiy shimol
    } else if (e.absolute === true && typeof e.alpha === 'number') {
      h = (360 - e.alpha) % 360; // Android (absolute), alpha = GRADUS
    }
    if (h == null || Number.isNaN(h)) return;
    lastEmit = now;
    onHeading((h + 360) % 360);
  };

  const attach = () => {
    window.addEventListener('deviceorientationabsolute', handle as EventListener, true);
    window.addEventListener('deviceorientation', handle as EventListener, true);
  };

  const DOE = (window as unknown as {
    DeviceOrientationEvent?: { requestPermission?: () => Promise<string> };
  }).DeviceOrientationEvent;

  if (DOE && typeof DOE.requestPermission === 'function') {
    const ask = () => DOE.requestPermission?.().then((r) => { if (r === 'granted') attach(); }).catch(() => {});
    const onFirstTouch = () => { ask(); window.removeEventListener('touchend', onFirstTouch); };
    window.addEventListener('touchend', onFirstTouch, { once: true });
    ask();
  } else {
    attach();
  }

  return () => {
    active = false;
    window.removeEventListener('deviceorientationabsolute', handle as EventListener, true);
    window.removeEventListener('deviceorientation', handle as EventListener, true);
  };
}
