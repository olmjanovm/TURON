import type { MapPin } from './MapProvider';

const SCRIPT_ID = 'turon-yandex-maps3-script';
let loadPromise: Promise<any> | null = null;

/** ymaps3 uses [longitude, latitude] — opposite of ymaps 2.1! */
export function toLngLat(pin: MapPin): [number, number] {
  return [pin.lng, pin.lat];
}

const YANDEX_JS_API_KEY = 'c3e2b675-cbbf-4886-b77a-3ed4e0d4f3f8';

export function isYandexMaps3Enabled() {
  const provider = import.meta.env.VITE_MAPS_PROVIDER ?? 'yandex';
  return provider === 'yandex';
}

export async function loadYandexMaps3(): Promise<any> {
  const existing = (window as any).ymaps3;
  if (existing) {
    await existing.ready;
    return existing;
  }

  if (loadPromise) return loadPromise;

  const apiKey = YANDEX_JS_API_KEY;
  const lang = import.meta.env.VITE_MAP_LANGUAGE ?? 'uz_UZ';

  loadPromise = new Promise<any>((resolve, reject) => {
    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    const onReady = async () => {
      const ymaps3 = (window as any).ymaps3;
      if (!ymaps3) { loadPromise = null; reject(new Error('ymaps3 yuklanmadi')); return; }
      try {
        await ymaps3.ready;
        resolve(ymaps3);
      } catch (err) {
        loadPromise = null;
        reject(err);
      }
    };

    const onError = () => {
      loadPromise = null;
      reject(new Error("Yandex Maps 3 yuklab bo'lmadi"));
    };

    if (existingScript) {
      if ((window as any).ymaps3) { void onReady(); return; }
      existingScript.addEventListener('load', () => void onReady(), { once: true });
      existingScript.addEventListener('error', onError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(apiKey)}&lang=${encodeURIComponent(lang)}`;
    script.async = true;
    script.onload = () => void onReady();
    script.onerror = onError;
    document.head.appendChild(script);
  });

  return loadPromise;
}
