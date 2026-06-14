'use client';

import distance from '@turf/distance';
import { point, lineString } from '@turf/helpers';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import pointToLineDistance from '@turf/point-to-line-distance';

import type { LatLng } from './yandex-maps';
import type { RouteSegment } from './route-fetcher';

type TurfLine = ReturnType<typeof lineString>;

/**
 * Marshrut geometriyasi — @turf/turf primitivlari ustida.
 *
 * Ichki konventsiya: [lng, lat] (GeoJSON). RouteSegment.coords ham shu formatda.
 * Turf ham GeoJSON ishlatadi — qo'shimcha o'rin almashtirish kerak emas.
 */

/** Ikki nuqta orasidagi great-circle masofa (metr). */
export function haversineMeters(a: LatLng, b: LatLng): number {
  return distance(point([a.lng, a.lat]), point([b.lng, b.lat]), { units: 'meters' });
}

/**
 * Segment polyline'ini turf LineString'ga konvertatsiya.
 * Yagona segment uchun — minimal allokatsiya.
 */
function toLineString(coords: [number, number][]): TurfLine | null {
  if (!coords || coords.length < 2) return null;
  return lineString(coords as number[][]);
}

/**
 * Point P dan AB segment chizig'iga eng yaqin masofa (metr).
 * Saqlanib qolgan API — eski chaqiruvchilar uchun.
 */
export function pointToSegmentMeters(
  p: LatLng,
  a: [number, number],
  b: [number, number],
): number {
  // Degenerate — segment = nuqta
  if (a[0] === b[0] && a[1] === b[1]) {
    return haversineMeters(p, { lat: a[1], lng: a[0] });
  }
  const line = lineString([a, b]);
  return pointToLineDistance(point([p.lng, p.lat]), line, { units: 'meters' });
}

/**
 * Kuryer'dan butun route polyline'iga eng yaqin masofa (metr).
 * Har bir segment uchun turf pointToLineDistance — barchasidan min.
 */
export function distanceToRoute(p: LatLng, segments: RouteSegment[]): number {
  if (segments.length === 0) return Infinity;
  const pt = point([p.lng, p.lat]);
  let minDist = Infinity;

  for (const seg of segments) {
    const line = toLineString(seg.coords);
    if (!line) continue;
    const d = pointToLineDistance(pt, line, { units: 'meters' });
    if (d < minDist) minDist = d;
    if (minDist < 1) return minDist;
  }
  return minDist;
}

/**
 * Kengaytirilgan: kuryer'ga eng yaqin route nuqtasi + qaysi segmentda + masofa.
 *  • snappedPoint — turf nearest-point-on-line natijasi ([lng, lat])
 *  • segmentIndex — qaysi RouteSegment'ga to'g'ri keladi
 *  • distanceMeters — perpendikular masofa
 *  • alongRouteMeters — segment boshlanishidan snap nuqtagacha (m)
 *
 * Maneuver HUD, deviation detector va "X meters left" hisoblari uchun
 * ishlatiladi.
 */
export interface RouteSnap {
  snappedPoint: [number, number];
  segmentIndex: number;
  distanceMeters: number;
  alongRouteMeters: number;
}

export function nearestOnRoute(p: LatLng, segments: RouteSegment[]): RouteSnap | null {
  if (segments.length === 0) return null;
  const pt = point([p.lng, p.lat]);

  let best: RouteSnap | null = null;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const line = toLineString(seg.coords);
    if (!line) continue;

    const snap = nearestPointOnLine(line, pt, { units: 'meters' });
    const props = snap.properties as { dist?: number; location?: number; index?: number } | undefined;

    const dist = props?.dist ?? Infinity;
    if (best == null || dist < best.distanceMeters) {
      const coords = snap.geometry.coordinates as [number, number];
      best = {
        snappedPoint: [coords[0], coords[1]],
        segmentIndex: i,
        distanceMeters: dist,
        alongRouteMeters: props?.location ?? 0,
      };
    }
  }

  return best;
}
