import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Yandex Routing API HTTP proxy.
 *
 * Maxsus YANDEX_ROUTER_API_KEY server-side ishlatiladi (browser'da emas).
 * Mijoz: GET /api/maps/route?from=lat,lng&to=lat,lng&mode=driving
 *
 * Yandex Routing API: https://api.routing.yandex.net/v2/route
 *   waypoints: lat,lng|lat,lng (max 100)
 *   mode: driving | walking | cycling | truck
 *   traffic: true (probkalarni hisoblaydi)
 *   apikey: ROUTER_API_KEY
 *
 * Javob normallashtirilgan formatda qaytadi — client polyline va maneuver
 * uchun ishlatadi. Yandex aniq formati o'zgarib turadi, shuning uchun
 * defensive parsing — har qanday struktura'dan extract qiladi.
 */

const ROUTER_API_KEY = process.env.YANDEX_ROUTER_API_KEY?.trim() ?? '';
const ROUTER_ENDPOINT = 'https://api.routing.yandex.net/v2/route';

interface NormalizedSegment {
  /** [lng, lat][] — segment chizig'i */
  coords: [number, number][];
  /** Trafik darajasi: 0 (toza) → 1 (qattiq probka). null = ma'lumot yo'q */
  traffic: number | null;
  /** Segment yo'l nomi (ko'rsatkichlar uchun) */
  street?: string;
  durationSec?: number;
  distanceMeters?: number;
  /** Yo'l tezligi chegarasi km/h */
  speedLimitKmh?: number | null;
}

interface NormalizedManeuver {
  /** [lng, lat] — burilish koordinatasi */
  coords: [number, number];
  /** Burilish turi: left | right | sharp-left | sharp-right | u-turn | roundabout | straight */
  type: string;
  /** Foydalanuvchi yo'riqnomasi */
  instruction?: string;
  /** Boshlanishdan masofasi (m) */
  distanceFromStartMeters?: number;
}

interface NormalizedRoute {
  ok: true;
  source: 'yandex-http' | 'yandex-http-fallback';
  segments: NormalizedSegment[];
  maneuvers: NormalizedManeuver[];
  totalDistanceMeters: number;
  totalDurationSec: number;
  /** Snap-to-road birinchi nuqta (kuryer bino ichida bo'lsa) */
  snappedStart: [number, number];
  /** Snap qilinmagan oxirgi nuqta */
  snappedEnd: [number, number];
}

interface ErrorResponse {
  ok: false;
  error: string;
  fallback: 'multirouter';
}

function parseLatLng(raw: string | null): [number, number] | null {
  if (!raw) return null;
  const parts = raw.split(',').map((s) => parseFloat(s.trim()));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null;
  return [parts[0], parts[1]];
}

/** Yandex polyline encoding — Google polyline'ga o'xshash. */
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    points.push([lng / 1e5, lat / 1e5]);
  }
  return points;
}

function trafficLevelFromString(s: string | undefined): number | null {
  if (!s) return null;
  const key = s.toLowerCase();
  if (key.includes('free') || key === 'green' || key === '0' || key === 'fast') return 0;
  if (key.includes('light') || key === 'yellow' || key === '1' || key === 'medium') return 0.4;
  if (key.includes('medium') || key === 'orange' || key === '2') return 0.65;
  if (key.includes('hard') || key === 'red' || key === '3' || key === 'heavy' || key.includes('jam')) return 0.9;
  return null;
}

/**
 * Yandex Routing API javobini defensive normallashtirish.
 * API turli versiyalarda format o'zgartirgan — har bir mavjud kalitni tekshiramiz.
 */
function normalize(raw: unknown): Omit<NormalizedRoute, 'ok' | 'source'> | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const route =
    (r.route as Record<string, unknown> | undefined) ??
    ((r.routes as unknown[] | undefined)?.[0] as Record<string, unknown> | undefined) ??
    r;
  if (!route) return null;

  const legsRaw = (route.legs ?? route.sections ?? []) as unknown[];
  const segments: NormalizedSegment[] = [];
  const maneuvers: NormalizedManeuver[] = [];
  let totalDistance = 0;
  let totalDuration = 0;
  let snappedStart: [number, number] | null = null;
  let snappedEnd: [number, number] | null = null;

  for (const legRaw of legsRaw) {
    const leg = legRaw as Record<string, unknown>;
    const stepsRaw = (leg.steps ?? leg.segments ?? []) as unknown[];

    for (const stepRaw of stepsRaw) {
      const step = stepRaw as Record<string, unknown>;

      // Coords — polyline, points yoki geometry
      let coords: [number, number][] = [];
      if (typeof step.polyline === 'string') {
        coords = decodePolyline(step.polyline);
      } else if (Array.isArray(step.points)) {
        coords = (step.points as unknown[])
          .map((p) => {
            if (Array.isArray(p) && p.length >= 2) {
              return [Number(p[0]), Number(p[1])] as [number, number];
            }
            if (typeof p === 'object' && p && 'lng' in p && 'lat' in p) {
              return [Number((p as { lng: number }).lng), Number((p as { lat: number }).lat)] as [number, number];
            }
            return null;
          })
          .filter((x): x is [number, number] => x != null);
      } else if (step.geometry && typeof step.geometry === 'object') {
        const geom = step.geometry as { coordinates?: unknown };
        if (Array.isArray(geom.coordinates)) {
          coords = (geom.coordinates as unknown[])
            .map((c) =>
              Array.isArray(c) && c.length >= 2 ? ([Number(c[0]), Number(c[1])] as [number, number]) : null,
            )
            .filter((x): x is [number, number] => x != null);
        }
      }

      if (coords.length === 0) continue;

      if (!snappedStart) snappedStart = coords[0];
      snappedEnd = coords[coords.length - 1];

      const durationVal =
        (step.duration as { value?: number })?.value ??
        (typeof step.duration === 'number' ? step.duration : 0);
      const distanceVal =
        (step.distance as { value?: number })?.value ??
        (typeof step.distance === 'number' ? step.distance : 0);

      totalDistance += distanceVal;
      totalDuration += durationVal;

      const trafficRaw =
        (step.traffic_level as string | undefined) ??
        (step.traffic as string | undefined) ??
        (step.jam as string | undefined);
      const traffic = trafficLevelFromString(trafficRaw);

      const street =
        (step.street as string | undefined) ??
        (step.name as string | undefined) ??
        ((step.metadata as { street?: string } | undefined)?.street);

      // Speed limit — har xil joylarda bo'lishi mumkin
      let speedLimitKmh: number | null = null;
      const speedLimitRaw =
        (step.speed_limit as number | undefined) ??
        (step.speedLimit as number | undefined) ??
        ((step.metadata as { speed_limit?: number } | undefined)?.speed_limit) ??
        ((step.attributes as { speed_limit?: number } | undefined)?.speed_limit);
      if (typeof speedLimitRaw === 'number' && speedLimitRaw > 0) {
        // Yandex ba'zan m/s qaytaradi → km/h ga konvertatsiya
        speedLimitKmh = speedLimitRaw < 50 ? Math.round(speedLimitRaw * 3.6) : Math.round(speedLimitRaw);
      }

      segments.push({ coords, traffic, street, durationSec: durationVal, distanceMeters: distanceVal, speedLimitKmh });

      // Maneuver
      const maneuverRaw = step.maneuver ?? (step.metadata as { maneuver?: unknown } | undefined)?.maneuver;
      if (maneuverRaw && typeof maneuverRaw === 'object') {
        const m = maneuverRaw as Record<string, unknown>;
        const type = typeof m.type === 'string' ? m.type : (m.action as string) ?? 'straight';
        const loc = (m.location as unknown[] | undefined) ?? (m.point as unknown[] | undefined);
        if (Array.isArray(loc) && loc.length >= 2) {
          maneuvers.push({
            coords: [Number(loc[0]), Number(loc[1])],
            type,
            instruction: typeof m.instruction === 'string' ? m.instruction : undefined,
            distanceFromStartMeters: totalDistance,
          });
        }
      }
    }
  }

  if (segments.length === 0 || !snappedStart || !snappedEnd) return null;

  // Total fallback to route-level fields
  if (totalDistance === 0) {
    const td = (route.distance as { value?: number })?.value ?? (route.totalDistance as number | undefined);
    if (typeof td === 'number') totalDistance = td;
  }
  if (totalDuration === 0) {
    const td = (route.duration as { value?: number })?.value ?? (route.totalDuration as number | undefined);
    if (typeof td === 'number') totalDuration = td;
  }

  return {
    segments,
    maneuvers,
    totalDistanceMeters: totalDistance,
    totalDurationSec: totalDuration,
    snappedStart,
    snappedEnd,
  };
}

export async function GET(req: NextRequest): Promise<NextResponse<NormalizedRoute | ErrorResponse>> {
  const sp = req.nextUrl.searchParams;
  const from = parseLatLng(sp.get('from'));
  const to = parseLatLng(sp.get('to'));
  const mode = (sp.get('mode') ?? 'driving') as 'driving' | 'walking' | 'cycling' | 'truck';

  if (!from || !to) {
    return NextResponse.json(
      { ok: false, error: 'from va to majburiy (format: lat,lng)', fallback: 'multirouter' as const },
      { status: 400 },
    );
  }
  if (!ROUTER_API_KEY) {
    return NextResponse.json(
      { ok: false, error: 'YANDEX_ROUTER_API_KEY o\'rnatilmagan', fallback: 'multirouter' as const },
      { status: 503 },
    );
  }

  // Yandex waypoints formati: "lat,lng|lat,lng"
  const waypoints = `${from[0]},${from[1]}|${to[0]},${to[1]}`;
  const url = new URL(ROUTER_ENDPOINT);
  url.searchParams.set('apikey', ROUTER_API_KEY);
  url.searchParams.set('waypoints', waypoints);
  url.searchParams.set('mode', mode);
  url.searchParams.set('traffic', 'true');
  url.searchParams.set('lang', 'uz_UZ');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);

  let upstream: Response;
  try {
    upstream = await fetch(url.toString(), {
      method: 'GET',
      headers: { accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const aborted = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      {
        ok: false,
        error: aborted ? 'Router API javob bermadi' : 'Router API bilan aloqa uzildi',
        fallback: 'multirouter' as const,
      },
      { status: aborted ? 504 : 502 },
    );
  }
  clearTimeout(timer);

  if (!upstream.ok) {
    return NextResponse.json(
      { ok: false, error: `Router API xato: ${upstream.status}`, fallback: 'multirouter' as const },
      { status: upstream.status },
    );
  }

  let json: unknown;
  try {
    json = await upstream.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Router API javobi noto\'g\'ri JSON', fallback: 'multirouter' as const },
      { status: 502 },
    );
  }

  const normalized = normalize(json);
  if (!normalized) {
    return NextResponse.json(
      { ok: false, error: 'Router API javobi tushunarsiz format', fallback: 'multirouter' as const },
      { status: 502 },
    );
  }

  const response: NormalizedRoute = {
    ok: true,
    source: 'yandex-http',
    ...normalized,
  };

  return NextResponse.json(response, {
    headers: { 'cache-control': 'no-store' },
  });
}

export type { NormalizedRoute, NormalizedSegment, NormalizedManeuver, ErrorResponse };
