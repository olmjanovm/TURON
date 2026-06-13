'use client';

/**
 * Yandex Maps v2 loader — singleton, SSR-safe.
 * Faqat client'da chaqiriladi (dynamic import bilan komponentdan).
 */

const SCRIPT_ID = 'turon-yandex-maps-script';

const API_KEY =
  process.env.NEXT_PUBLIC_MAP_API_KEY?.trim() ||
  'c3e2b675-cbbf-4886-b77a-3ed4e0d4f3f8'; // dev fallback (mavjud miniapp kalit)
const LANG = process.env.NEXT_PUBLIC_MAP_LANGUAGE?.trim() || 'uz_UZ';

export interface LatLng {
  lat: number;
  lng: number;
}

type Ymaps = {
  Map: new (container: HTMLElement | string, state: Record<string, unknown>, options?: Record<string, unknown>) => YmapInstance;
  Placemark: new (geometry: number[], properties?: Record<string, unknown>, options?: Record<string, unknown>) => YmapObject;
  Polyline: new (geometry: number[][], properties?: Record<string, unknown>, options?: Record<string, unknown>) => YmapObject;
  ready: (cb: () => void) => void;
  route?: (points: unknown[], params?: Record<string, unknown>) => Promise<{ getPaths: () => { getLength: () => number; get: (i: number) => unknown } } | null>;
  multiRouter?: {
    MultiRoute: new (model: Record<string, unknown>, options?: Record<string, unknown>) => YmapObject;
  };
};

interface YmapObject {
  geometry?: { getCoordinates?: () => number[]; setCoordinates?: (coords: number[]) => void };
  events?: { add?: (event: string, handler: () => void) => void };
  options?: { set?: (key: string, value: unknown) => void };
}

interface YmapInstance {
  geoObjects: { add: (obj: unknown) => void; remove: (obj: unknown) => void; removeAll: () => void };
  setCenter: (coords: number[], zoom?: number, opts?: { duration?: number }) => Promise<unknown>;
  getZoom: () => number;
  setBounds: (bounds: number[][], opts?: { checkZoomRange?: boolean; zoomMargin?: number[] }) => Promise<unknown>;
  destroy: () => void;
}

let loadPromise: Promise<Ymaps> | null = null;

declare global {
  interface Window {
    ymaps?: Ymaps;
  }
}

export function isMapsConfigured(): boolean {
  return !!API_KEY && API_KEY.length > 0;
}

export function loadYandexMaps(): Promise<Ymaps> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Yandex Maps faqat client-side ishlaydi'));
  }
  if (window.ymaps && (window.ymaps as Ymaps & { Map?: unknown }).Map) {
    return new Promise<Ymaps>((resolve) => window.ymaps!.ready(() => resolve(window.ymaps as Ymaps)));
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<Ymaps>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const onReady = () => {
      if (!window.ymaps) {
        loadPromise = null;
        reject(new Error('Yandex Maps yuklanmadi'));
        return;
      }
      window.ymaps.ready(() => resolve(window.ymaps as Ymaps));
    };
    const onError = () => {
      loadPromise = null;
      reject(new Error("Yandex Maps skriptini yuklab bo'lmadi"));
    };

    if (existing) {
      existing.addEventListener('load', onReady, { once: true });
      existing.addEventListener('error', onError, { once: true });
      if (window.ymaps) onReady();
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(API_KEY)}&lang=${encodeURIComponent(LANG)}&load=package.full`;
    script.async = true;
    script.onload = onReady;
    script.onerror = onError;
    document.head.appendChild(script);
  });

  return loadPromise;
}

export const RESTAURANT_DEFAULT: LatLng = { lat: 41.2995, lng: 69.2401 };

/**
 * Browser geolocation — Promise wrapper.
 * Telegram WebApp ham xuddi shu API'ni ishlatadi (cross-platform).
 */
export function getCurrentLocation(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Brauzeringiz geolokatsiyani qo\'llab-quvvatlamaydi'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('Joylashuv ruxsati berilmagan. Sozlamalardan ruxsat bering.'));
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          reject(new Error('Joylashuvni aniqlab bo\'lmadi'));
        } else if (err.code === err.TIMEOUT) {
          reject(new Error('Joylashuv aniqlash vaqti tugadi'));
        } else {
          reject(new Error('Joylashuvni olishda xato'));
        }
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    );
  });
}

/**
 * Reverse geocode — koordinatadan manzil matni.
 * Yandex Maps APIga so'rov yuboradi, natija bo'lmasa null.
 */
export async function reverseGeocode(point: LatLng): Promise<string | null> {
  try {
    const ymaps = await loadYandexMaps();
    const ymapsWithGeocode = ymaps as Ymaps & {
      geocode?: (point: number[], opts?: Record<string, unknown>) => Promise<{
        geoObjects: { get: (i: number) => { getAddressLine?: () => string; properties?: { get?: (k: string) => string } } | null };
      }>;
    };
    if (!ymapsWithGeocode.geocode) return null;
    const result = await ymapsWithGeocode.geocode([point.lat, point.lng], {
      kind: 'house',
      results: 1,
    });
    const obj = result.geoObjects.get(0);
    if (!obj) return null;
    return obj.getAddressLine?.() ?? obj.properties?.get?.('text') ?? null;
  } catch {
    return null;
  }
}

export type { Ymaps, YmapObject, YmapInstance };
