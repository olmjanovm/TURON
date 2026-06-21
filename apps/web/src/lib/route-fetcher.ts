'use client';

import type { LatLng, Ymaps, YmapObject } from './yandex-maps';
import { saveRoute, loadRoute } from './route-cache';

export interface RouteSegment {
  /** [lng, lat][] */
  coords: [number, number][];
  /** 0 (free) → 1 (heavy traffic). null = unknown. */
  traffic: number | null;
  street?: string;
  /** km/soat — Yandex API'dan yoki yo'l turidan default */
  speedLimitKmh?: number | null;
}

export interface RouteManeuver {
  /** [lng, lat] */
  coords: [number, number];
  type: string;
  instruction?: string;
  distanceFromStartMeters?: number;
}

export interface RouteResult {
  segments: RouteSegment[];
  maneuvers: RouteManeuver[];
  totalDistanceMeters: number;
  totalDurationSec: number;
  snappedStart: [number, number];
  snappedEnd: [number, number];
  source: 'yandex-http' | 'multirouter' | 'ors' | 'cache';
}

type Mode = 'auto' | 'pedestrian' | 'bicycle';

// ── OpenRouteService (BEPUL routing — Yandex routing pullik/rad etilgani uchun) ──
// Brauzerdan to'g'ridan-to'g'ri chaqiriladi (CORS yoqilgan). Kalit BEPUL:
// openrouteservice.org → ro'yxatdan o'tish → NEXT_PUBLIC_ORS_API_KEY Vercel env.
const ORS_API_KEY =
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_ORS_API_KEY?.trim() : '') || '';
const ORS_PROFILE: Record<Mode, string> = {
  auto: 'driving-car',
  pedestrian: 'foot-walking',
  bicycle: 'cycling-regular',
};

/** ORS step.type (0-13) → ichki maneuver type. */
function orsManeuverType(t: number | undefined): string {
  switch (t) {
    case 0: return 'left';
    case 1: return 'right';
    case 2: return 'sharp-left';
    case 3: return 'sharp-right';
    case 4: case 12: return 'slight-left';
    case 5: case 13: return 'slight-right';
    case 7: case 8: return 'roundabout';
    case 9: return 'u-turn';
    default: return 'straight';
  }
}

// Yandex Router API v2 mode qiymatlari (rasmiy hujjat): driving | walking | bicycle | scooter.
// (Ilgari bicycle→'cycling' edi — Yandex uni qabul qilmaydi.)
const MODE_HTTP_MAP: Record<Mode, 'driving' | 'walking' | 'bicycle'> = {
  auto: 'driving',
  pedestrian: 'walking',
  bicycle: 'bicycle',
};

/**
 * Asosiy: server proxy (HTTP Router API). Fallback: multiRouter (JS API).
 *
 * Server route'idan kelgan ma'lumotda traffic colored polylines bor.
 * Agar HTTP API ishlamasa (auth, network, format), multiRouter ishlatiladi —
 * undan polyline ko'rinishi olinadi, lekin trafik darajasi bo'lmaydi.
 */
export async function fetchRoute(
  from: LatLng,
  to: LatLng,
  mode: Mode,
  ymaps: Ymaps,
): Promise<RouteResult | null> {
  // OFFLINE — cache'dan o'qish (agar internet yo'q bo'lsa)
  const online = typeof navigator === 'undefined' ? true : navigator.onLine;
  if (!online) {
    const cached = loadRoute(from, to, mode);
    if (cached) return { ...cached, source: 'cache' };
    return null;
  }

  // 1) OpenRouteService — BIRLAMCHI (bepul, aniq yo'l; Yandex routing rad etilgan)
  const orsResult = await fetchFromORS(from, to, mode);
  if (orsResult) {
    saveRoute(from, to, mode, orsResult);
    return orsResult;
  }

  // 2) Yandex HTTP Router API (kalit Router'ga ruxsatli bo'lsa)
  const httpResult = await fetchFromHttp(from, to, mode);
  if (httpResult) {
    saveRoute(from, to, mode, httpResult);
    return httpResult;
  }

  // 3) Fallback — Yandex multiRouter (JS API)
  const multiResult = await fetchFromMultiRouter(from, to, mode, ymaps);
  if (multiResult) {
    saveRoute(from, to, mode, multiResult);
    return multiResult;
  }

  // 3) Eng oxirgi — eski cache (yangi marshrut yo'q bo'lsa)
  const stale = loadRoute(from, to, mode);
  if (stale) return { ...stale, source: 'cache' };
  return null;
}

/**
 * OpenRouteService — bepul yo'l hisoblash (foot-walking / driving-car / cycling).
 * GeoJSON qaytaradi: features[0].geometry.coordinates = [[lng,lat],...] (bizning
 * ichki [lng,lat] formatga AYNAN mos — swap kerak emas).
 */
async function fetchFromORS(from: LatLng, to: LatLng, mode: Mode): Promise<RouteResult | null> {
  if (!ORS_API_KEY) return null;
  try {
    const profile = ORS_PROFILE[mode];
    const url =
      `https://api.openrouteservice.org/v2/directions/${profile}` +
      `?api_key=${encodeURIComponent(ORS_API_KEY)}` +
      `&start=${from.lng},${from.lat}&end=${to.lng},${to.lat}`;
    const res = await fetch(url, { headers: { accept: 'application/geo+json' }, cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const feat = data?.features?.[0];
    const coordsRaw = feat?.geometry?.coordinates as number[][] | undefined;
    if (!coordsRaw || coordsRaw.length < 2) return null;

    const coords: [number, number][] = coordsRaw
      .filter((c) => Array.isArray(c) && c.length >= 2)
      .map((c) => [Number(c[0]), Number(c[1])]); // [lng, lat] — ichki formatga mos
    if (coords.length < 2) return null;

    const summary = (feat?.properties?.summary ?? {}) as { distance?: number; duration?: number };
    const segs = feat?.properties?.segments as
      | Array<{ steps?: Array<{ instruction?: string; type?: number; way_points?: number[]; distance?: number }> }>
      | undefined;

    const maneuvers: RouteManeuver[] = [];
    let cum = 0;
    if (Array.isArray(segs)) {
      for (const s of segs) {
        for (const st of s.steps ?? []) {
          const wp = st.way_points?.[0];
          if (typeof wp === 'number' && coordsRaw[wp]?.length >= 2) {
            maneuvers.push({
              coords: [Number(coordsRaw[wp][0]), Number(coordsRaw[wp][1])],
              type: orsManeuverType(st.type),
              instruction: typeof st.instruction === 'string' ? st.instruction : undefined,
              distanceFromStartMeters: cum,
            });
          }
          cum += typeof st.distance === 'number' ? st.distance : 0;
        }
      }
    }

    return {
      segments: [{ coords, traffic: null, speedLimitKmh: null }],
      maneuvers,
      totalDistanceMeters: Number(summary.distance) || 0,
      totalDurationSec: Number(summary.duration) || 0,
      snappedStart: coords[0],
      snappedEnd: coords[coords.length - 1],
      source: 'ors',
    };
  } catch {
    return null;
  }
}

async function fetchFromHttp(from: LatLng, to: LatLng, mode: Mode): Promise<RouteResult | null> {
  try {
    const url = `/api/maps/route?from=${from.lat},${from.lng}&to=${to.lat},${to.lng}&mode=${MODE_HTTP_MAP[mode]}`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    if (!data?.ok) return null;
    return {
      segments: data.segments,
      maneuvers: data.maneuvers,
      totalDistanceMeters: data.totalDistanceMeters,
      totalDurationSec: data.totalDurationSec,
      snappedStart: data.snappedStart,
      snappedEnd: data.snappedEnd,
      source: 'yandex-http',
    };
  } catch {
    return null;
  }
}

function fetchFromMultiRouter(
  from: LatLng,
  to: LatLng,
  mode: Mode,
  ymaps: Ymaps,
): Promise<RouteResult | null> {
  return new Promise((resolve) => {
    if (!ymaps.multiRouter) {
      resolve(null);
      return;
    }
    try {
      const multiRoute = new ymaps.multiRouter.MultiRoute(
        {
          referencePoints: [
            [from.lat, from.lng],
            [to.lat, to.lng],
          ],
          params: {
            routingMode: mode,
            avoidTrafficJams: mode === 'auto',
            results: 1,
          },
        },
        { boundsAutoApply: false, wayPointVisible: false },
      ) as YmapObject;

      const onSuccess = () => {
        try {
          const routes = multiRoute.getRoutes?.();
          if (!routes || routes.getLength() === 0) {
            resolve(null);
            return;
          }
          const route = routes.get(0) as YmapObject & {
            properties: {
              get: (k: string) => unknown;
            };
          };
          const distance = (route.properties.get('distance') as { value: number } | undefined)?.value ?? 0;
          const duration =
            ((route.properties.get('jamsDuration') as { value: number } | undefined)?.value ??
              (route.properties.get('duration') as { value: number } | undefined)?.value) ??
            0;

          // Path segments
          const paths = route.getPaths?.();
          if (!paths || paths.getLength() === 0) {
            resolve(null);
            return;
          }
          const path = paths.get(0) as YmapObject & {
            properties?: { get?: (k: string) => unknown };
            geometry?: { getCoordinates?: () => unknown };
          };

          const segments: RouteSegment[] = [];

          // 2 manbani ham qurib ko'ramiz, MUSTAHKAM tanlaymiz:
          //  • butun UZLUKSIZ path (path.geometry) — aniq, gap yo'q
          //  • per-segment (path.getSegments) — `jams.severity` bilan trafik rangi
          const fullPathCoords = path.geometry?.getCoordinates?.() as number[][] | undefined;
          const fullSeg: RouteSegment | null =
            fullPathCoords && fullPathCoords.length >= 2
              ? { coords: fullPathCoords.map((p) => [p[1], p[0]]), traffic: null, speedLimitKmh: null }
              : null;

          const perSeg: RouteSegment[] = [];
          const pathSegments = (path.getSegments?.() ?? []) as Array<
            YmapObject & {
              properties?: { get?: (k: string) => unknown };
              geometry?: { getCoordinates?: () => unknown };
            }
          >;
          for (const seg of pathSegments) {
            const c = seg.geometry?.getCoordinates?.() as number[][] | undefined;
            if (!c || c.length < 2) continue;
            const coords: [number, number][] = c.map((p) => [p[1], p[0]]);
            const street = (seg.properties?.get?.('street') as string | undefined) ?? undefined;
            const jam = seg.properties?.get?.('jams') as { severity?: number } | undefined;
            const traffic =
              typeof jam?.severity === 'number' ? Math.min(1, Math.max(0, jam.severity / 10)) : null;
            const speedRaw = seg.properties?.get?.('speedLimit') as number | undefined;
            const speedLimitKmh =
              typeof speedRaw === 'number'
                ? speedRaw < 50
                  ? Math.round(speedRaw * 3.6)
                  : Math.round(speedRaw)
                : null;
            perSeg.push({ coords, traffic, street, speedLimitKmh });
          }

          // AUTO → trafik gradient muhim (per-segment); bo'sh bo'lsa uzluksiz path.
          // PIYODA/VELOSIPED → uzluksiz aniq yo'l (full); bo'sh bo'lsa per-segment.
          if (mode === 'auto') {
            if (perSeg.length > 0) segments.push(...perSeg);
            else if (fullSeg) segments.push(fullSeg);
          } else {
            if (fullSeg) segments.push(fullSeg);
            else if (perSeg.length > 0) segments.push(...perSeg);
          }
          if (segments.length === 0 && fullSeg) {
            segments.push(fullSeg);
          }

          // Maneuvers — har segment'da
          // Maneuvers — har doim segmentlarni olamiz (faqat maneuver uchun)
          const maneuverSegments = (path.getSegments?.() ?? []) as Array<
            YmapObject & {
              properties?: { get?: (k: string) => unknown };
              geometry?: { getCoordinates?: () => unknown };
            }
          >;

          const maneuvers: RouteManeuver[] = [];
          let cumDist = 0;
          for (const seg of maneuverSegments) {
            const len = (seg.properties?.get?.('distance') as { value: number } | undefined)?.value ?? 0;
            const action = seg.properties?.get?.('action') as { type?: string; text?: string } | undefined;
            if (action?.type && action.type !== 'straight') {
              const c = seg.geometry?.getCoordinates?.() as number[][] | undefined;
              if (c && c.length > 0) {
                maneuvers.push({
                  coords: [c[0][1], c[0][0]],
                  type: action.type,
                  instruction: action.text,
                  distanceFromStartMeters: cumDist,
                });
              }
            }
            cumDist += len;
          }

          const snappedStart = segments[0]?.coords[0] ?? [from.lng, from.lat];
          const last = segments[segments.length - 1];
          const snappedEnd = last?.coords[last.coords.length - 1] ?? [to.lng, to.lat];

          resolve({
            segments,
            maneuvers,
            totalDistanceMeters: distance,
            totalDurationSec: duration,
            snappedStart,
            snappedEnd,
            source: 'multirouter',
          });
        } catch {
          resolve(null);
        }
      };

      // multiRouter event tinglaymiz, lekin biz uni xaritaga qo'shmaymiz —
      // faqat ma'lumot olamiz va o'zimiz chizamiz
      multiRoute.model?.events?.add?.('requestsuccess', onSuccess);
      multiRoute.model?.events?.add?.('requestfail', () => resolve(null));

      // MUSTAHKAMLIK: route bog'lashdan OLDIN hisoblanган bo'lishi mumkin (cache/
      // sinxron) — event o'tkazib yuborilmasin. Allaqachon route bor bo'lsa darrov.
      try {
        const already = (multiRoute as YmapObject & {
          getRoutes?: () => { getLength?: () => number };
        }).getRoutes?.();
        if (already && (already.getLength?.() ?? 0) > 0) onSuccess();
      } catch {/* */}

      // Timeout — 8s
      setTimeout(() => resolve(null), 8_000);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Trafik darajasiga qarab rang — Yandex Navigator etalon palitrasi (C3-7).
 * free (yashil) → medium (sariq) → heavy (to'q-sariq) → jam (qizil) → severe (to'q-qizil).
 */
export function trafficColor(traffic: number | null): string {
  if (traffic == null) return '#39C75A'; // default — yo'l toza (yashil)
  if (traffic < 0.2) return '#39C75A';   // free — yashil
  if (traffic < 0.45) return '#F5C518';  // medium — sariq
  if (traffic < 0.65) return '#F08229';  // heavy — to'q-sariq
  if (traffic < 0.85) return '#E8413A';  // jam — qizil
  return '#9E2B25';                       // severe — to'q-qizil
}
