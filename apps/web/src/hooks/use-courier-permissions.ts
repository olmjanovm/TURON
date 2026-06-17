'use client';

import { useCallback, useState } from 'react';

/**
 * Kuryer ruxsatlari — BIR user gesture'da (ishni boshlash/online'ga o'tish)
 * kompas (DeviceOrientation) va GPS (geolocation) ketma-ket so'raladi, natija
 * localStorage'ga cache qilinadi → QAYTA so'ralmaydi (C3-4).
 *
 * OS'da "bitta allow" yo'q (har sensor alohida ruxsat tizimi), lekin bitta
 * teginishda ketma-ket so'rab, foydalanuvchi uchun "bir martalik" his yaratamiz.
 *
 * ⚠️ MUHIM (iOS): `DeviceOrientationEvent.requestPermission()` FAQAT haqiqiy
 * user gesture ichida SYNCHRON boshlanishi kerak. Shuning uchun bu funksiya
 * click handler ichidan TO'G'RIDAN-TO'G'RI chaqirilsin — undan oldin `await`
 * qo'yilmasin (kompas so'rovi birinchi, hech qanday async'dan keyin emas).
 */

const LS_KEY = 'courier:permissions';

export type GeoState = 'granted' | 'denied' | 'unavailable';
export type CompassState = 'granted' | 'denied' | 'unsupported';

export interface PermissionResult {
  geo: GeoState;
  compass: CompassState;
}

function loadCached(): PermissionResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as PermissionResult;
    if (obj && typeof obj.geo === 'string' && typeof obj.compass === 'string') return obj;
    return null;
  } catch {
    return null;
  }
}

function saveCached(r: PermissionResult): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(r));
  } catch {
    /* kvota / private rejim — e'tiborsiz */
  }
}

async function requestCompass(): Promise<CompassState> {
  if (typeof DeviceOrientationEvent === 'undefined') return 'unsupported';
  const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
  // Android / desktop — alohida ruxsat yo'q, darrov ishlatsa bo'ladi
  if (typeof DOE.requestPermission !== 'function') return 'granted';
  try {
    const result = await DOE.requestPermission();
    return result === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

function requestGeo(): Promise<GeoState> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve('unavailable');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      (err) => resolve(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  });
}

export function useCourierPermissions() {
  const [requesting, setRequesting] = useState(false);

  /**
   * Click handler ichidan TO'G'RIDAN-TO'G'RI chaqir (await'siz).
   * Avval cache tekshiriladi — bir marta so'ralgan bo'lsa qayta so'ramaydi.
   * `force: true` — sozlamalardan qayta so'rashga majburlash.
   */
  const ensurePermissions = useCallback(
    async (opts?: { force?: boolean }): Promise<PermissionResult | null> => {
      if (!opts?.force && loadCached()) return loadCached();
      setRequesting(true);
      // 1) Kompas — gesture'da SINxron boshlanadi (iOS talabi)
      const compass = await requestCompass();
      // 2) GPS — kompasdan keyin (bir teginish ichida ketma-ket)
      const geo = await requestGeo();
      const result: PermissionResult = { geo, compass };
      saveCached(result);
      setRequesting(false);
      return result;
    },
    [],
  );

  return { ensurePermissions, requesting, getCached: loadCached };
}
