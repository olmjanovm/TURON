'use client';

/**
 * Qurilma kompasi (DeviceOrientation) → yo'nalish (0=shimol, soat strelkasi bo'yicha).
 * Navigatorda xarita azimutini telefon qaysi tomonga qaragani bo'yicha aylantirish
 * uchun — GPS heading turganda null bo'ladi, kompas esa harakatsiz ham ishlaydi.
 *
 *  • iOS: `event.webkitCompassHeading` (allaqachon haqiqiy shimolga nisbatan).
 *  • Android: `deviceorientationabsolute` → `alpha` (360 - alpha = heading).
 *  • iOS 13+ ruxsat (requestPermission) — birinchi tegishda (user gesture) so'raladi.
 *  • Absolute bo'lmagan (nisbiy) `deviceorientation` E'TIBORGA OLINMAYDI (noto'g'ri
 *    shimol bermasligi uchun) — bunday holда GPS heading / harakat bearing'iga tushadi.
 */
export type CompassHandler = (headingDeg: number) => void;

export function startCompass(onHeading: CompassHandler): () => void {
  if (typeof window === 'undefined') return () => {};
  let active = true;
  let lastEmit = 0;

  const handle = (e: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
    if (!active) return;
    const now = Date.now();
    if (now - lastEmit < 80) return; // ~12 Hz throttle

    let h: number | null = null;
    if (typeof e.webkitCompassHeading === 'number' && !Number.isNaN(e.webkitCompassHeading)) {
      h = e.webkitCompassHeading; // iOS — haqiqiy shimol
    } else if (e.absolute === true && typeof e.alpha === 'number') {
      h = (360 - e.alpha) % 360; // Android (absolute)
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
    // iOS 13+ — ruxsat user gesture talab qiladi
    const ask = () => DOE.requestPermission?.().then((r) => { if (r === 'granted') attach(); }).catch(() => {});
    const onFirstTouch = () => { ask(); window.removeEventListener('touchend', onFirstTouch); };
    window.addEventListener('touchend', onFirstTouch, { once: true });
    ask(); // ba'zi WebView'lar gestures'iz ham ruxsat beradi
  } else {
    attach();
  }

  return () => {
    active = false;
    window.removeEventListener('deviceorientationabsolute', handle as EventListener, true);
    window.removeEventListener('deviceorientation', handle as EventListener, true);
  };
}
