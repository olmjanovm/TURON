'use client';

/**
 * Yandex Maps v2.1 — singleton loader, SSR-safe.
 * Foydalanuvchi 4 ta alohida API kalit bergan:
 *   - YANDEX_MAP_API_KEY         — JS API yuklash (asosiy)
 *   - YANDEX_GEOCODER_API_KEY    — manzil ↔ koordinata
 *   - YANDEX_GEOSUGGEST_API_KEY  — manzil avtomatik takliflar
 *   - YANDEX_ROUTER_API_KEY      — yo'l marshruti
 *   - YANDEX_DISTANCE_MATRIX_API_KEY — masofa hisoblash
 *
 * JS API v2.1 yuklanganda MAP_API_KEY ishlatamiz — multiRouter, geocode,
 * suggest hammasi shu kalit orqali. Alohida HTTP API kalitlar backend
 * server-side qo'ng'iroqlar uchun (NEXT_PUBLIC_ prefix yo'q).
 */

const SCRIPT_ID = 'turon-yandex-maps-script';

// Browserda yuklanadigan kalit — NEXT_PUBLIC_ majburiy
const API_KEY =
  process.env.NEXT_PUBLIC_YANDEX_MAP_API_KEY?.trim() ||
  process.env.NEXT_PUBLIC_MAP_API_KEY?.trim() || // legacy
  'c3e2b675-cbbf-4886-b77a-3ed4e0d4f3f8'; // dev fallback (mavjud kalit)

const LANG = process.env.NEXT_PUBLIC_MAP_LANGUAGE?.trim() || 'uz_UZ';

export interface LatLng {
  lat: number;
  lng: number;
}

type Ymaps = {
  Map: new (
    container: HTMLElement | string,
    state: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => YmapInstance;
  Placemark: new (
    geometry: number[],
    properties?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => YmapObject;
  Polyline: new (
    geometry: number[][],
    properties?: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => YmapObject;
  ready: (cb: () => void) => void;
  geocode?: (
    request: string | number[],
    options?: Record<string, unknown>,
  ) => Promise<unknown>;
  route?: (points: unknown[], params?: Record<string, unknown>) => Promise<unknown>;
  multiRouter?: {
    MultiRoute: new (
      model: Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => YmapObject;
  };
  templateLayoutFactory?: {
    createClass: (template: string, overrides?: Record<string, unknown>) => unknown;
  };
};

interface YmapObject {
  geometry?: {
    getCoordinates?: () => number[];
    setCoordinates?: (coords: number[]) => void;
  };
  properties?: {
    get?: (key: string) => unknown;
    set?: (key: string, value: unknown) => void;
  };
  events?: { add?: (event: string | string[], handler: (e?: unknown) => void) => void };
  options?: { set?: (key: string, value: unknown) => void };
  // multiRouter helpers (typed loosely — Yandex'da rasmiy types yo'q)
  model?: {
    setReferencePoints?: (refs: unknown[]) => void;
    events?: { add?: (event: string, handler: () => void) => void };
  };
  getRoutes?: () => { getLength: () => number; get: (i: number) => YmapObject };
  getPaths?: () => { getLength: () => number; get: (i: number) => YmapObject };
  getSegments?: () => YmapObject[];
}

interface YmapInstance {
  geoObjects: {
    add: (obj: unknown) => void;
    remove: (obj: unknown) => void;
    removeAll: () => void;
  };
  setCenter: (coords: number[], zoom?: number, opts?: { duration?: number }) => Promise<unknown>;
  panTo: (coords: number[] | number[][], opts?: { flying?: boolean; duration?: number }) => Promise<unknown>;
  getZoom: () => number;
  setZoom: (zoom: number, opts?: { duration?: number }) => Promise<unknown>;
  setBounds: (
    bounds: number[][],
    opts?: { checkZoomRange?: boolean; zoomMargin?: number[]; duration?: number },
  ) => Promise<unknown>;
  events: { add: (event: string | string[], handler: () => void) => void };
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
    // load=package.full — multiRouter, templateLayoutFactory, geocode, hammasi
    script.src =
      `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(API_KEY)}` +
      `&lang=${encodeURIComponent(LANG)}&load=package.full`;
    script.async = true;
    script.onload = onReady;
    script.onerror = onError;
    document.head.appendChild(script);
  });

  return loadPromise;
}

export const RESTAURANT_DEFAULT: LatLng = { lat: 41.2995, lng: 69.2401 };

/**
 * Brauzer geolokatsiyasi — Promise wrapper.
 */
export function getCurrentLocation(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error("Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('Joylashuv ruxsati berilmagan. Sozlamalardan ruxsat bering.'));
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          reject(new Error("Joylashuvni aniqlab bo'lmadi"));
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
 *
 * MUHIM: Yandex geocode promise'i ba'zan (kalit ruxsati/tarmoq) HECH QACHON
 * resolve bo'lmaydi → UI "Aniqlanmoqda..."da qotib qoladi. Shuning uchun
 * `timeoutMs` (default 5s) bilan poyga qilamiz — kechiksa null qaytadi va
 * chaqiruvchi koordinatani fallback sifatida ishlatadi.
 */
export async function reverseGeocode(
  point: LatLng,
  timeoutMs = 5000,
): Promise<string | null> {
  try {
    const ymaps = await loadYandexMaps();
    if (!ymaps.geocode) return null;
    const geocodePromise = ymaps.geocode([point.lat, point.lng], {
      kind: 'house',
      results: 1,
    }) as Promise<{
      geoObjects: {
        get: (i: number) => {
          getAddressLine?: () => string;
          properties?: { get?: (k: string) => string };
        } | null;
      };
    }>;
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('geocode-timeout')), timeoutMs),
    );
    const result = await Promise.race([geocodePromise, timeout]);
    const obj = result.geoObjects.get(0);
    if (!obj) return null;
    return obj.getAddressLine?.() ?? obj.properties?.get?.('text') ?? null;
  } catch {
    return null;
  }
}

export type { Ymaps, YmapObject, YmapInstance };
