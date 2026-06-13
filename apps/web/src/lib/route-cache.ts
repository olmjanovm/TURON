'use client';

import type { RouteResult } from './route-fetcher';
import type { LatLng } from './yandex-maps';

/**
 * Marshrutni localStorage'ga cache qiladi (offline rejim uchun).
 * IndexedDB o'rniga localStorage — sinxron, sodda, marshrut payload kichik (<100KB).
 *
 * Cache strategy:
 *   - Key: from_to_mode (3 ta o'nlik aniqlik — 100m radius'ga ishonchli)
 *   - TTL: 30 daqiqa (yo'l holati o'zgarib turadi)
 *   - Tolerance: from coords ±300m bo'lsa cache valid (yaqindan boshlasa ham)
 */

const STORAGE_KEY = 'turon-route-cache-v1';
const TTL_MS = 30 * 60 * 1000;
const NEAR_TOLERANCE_METERS = 300;

interface CachedEntry {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  mode: string;
  result: RouteResult;
  savedAt: number;
}

function distM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(x));
}

export function saveRoute(from: LatLng, to: LatLng, mode: string, result: RouteResult): void {
  if (typeof window === 'undefined') return;
  try {
    const entry: CachedEntry = {
      fromLat: from.lat,
      fromLng: from.lng,
      toLat: to.lat,
      toLng: to.lng,
      mode,
      result,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {/* quota / privacy mode */}
}

export function loadRoute(from: LatLng, to: LatLng, mode: string): RouteResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CachedEntry;

    if (entry.mode !== mode) return null;
    if (Date.now() - entry.savedAt > TTL_MS) return null;

    // Destination majburiy mos kelishi kerak (juda yaqin)
    const destDelta = distM(
      { lat: entry.toLat, lng: entry.toLng },
      { lat: to.lat, lng: to.lng },
    );
    if (destDelta > 100) return null;

    // From — kengroq tolerance (kuryer harakatlanyapti)
    const fromDelta = distM(
      { lat: entry.fromLat, lng: entry.fromLng },
      { lat: from.lat, lng: from.lng },
    );
    if (fromDelta > NEAR_TOLERANCE_METERS) return null;

    return entry.result;
  } catch {
    return null;
  }
}

export function clearRouteCache(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {/* */}
}
