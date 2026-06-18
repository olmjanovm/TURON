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
  source: 'yandex-http' | 'multirouter' | 'cache';
}

type Mode = 'auto' | 'pedestrian' | 'bicycle';

const MODE_HTTP_MAP: Record<Mode, 'driving' | 'walking' | 'cycling'> = {
  auto: 'driving',
  pedestrian: 'walking',
  bicycle: 'cycling',
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

  // 1) HTTP Router API orqali
  const httpResult = await fetchFromHttp(from, to, mode);
  if (httpResult) {
    saveRoute(from, to, mode, httpResult);
    return httpResult;
  }

  // 2) Fallback — multiRouter
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

          // ASOSIY USUL (C3-7 — trafik gradient): har PATH-SEGMENT'ni alohida olamiz
          // va `jams.severity` bo'yicha ranglaymiz → Yandex etalonidagi yashil→sariq→
          // qizil yo'l chizig'i. (Ilgari butun path BITTA `traffic:null` segment qilinib
          // jams TASHLAB yuborilardi → chiziq doim bitta rangda edi.)
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
              typeof jam?.severity === 'number'
                ? Math.min(1, Math.max(0, jam.severity / 10))
                : null;
            const speedRaw = seg.properties?.get?.('speedLimit') as number | undefined;
            const speedLimitKmh =
              typeof speedRaw === 'number'
                ? speedRaw < 50
                  ? Math.round(speedRaw * 3.6)
                  : Math.round(speedRaw)
                : null;
            segments.push({ coords, traffic, street, speedLimitKmh });
          }

          // FALLBACK: segmentlar coord bermasa — butun path BITTA chiziq (bo'sh qolmasin).
          if (segments.length === 0) {
            const fullPathCoords = path.geometry?.getCoordinates?.() as number[][] | undefined;
            if (fullPathCoords && fullPathCoords.length >= 2) {
              const coords: [number, number][] = fullPathCoords.map((p) => [p[1], p[0]]);
              segments.push({ coords, traffic: null, speedLimitKmh: null });
            }
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
