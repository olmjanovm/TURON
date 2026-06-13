'use client';

import type { LatLng } from './yandex-maps';
import type { RouteSegment } from './route-fetcher';

/**
 * Marshrutdan deviation hisoblash util'i.
 * Kichik masofalarda equirectangular projection ishlatilamiz —
 * 100km radius'da 0.5%'dan kam xato beradi.
 */

const EARTH_R = 6_371_000;

/**
 * Point P dan AB segment chizig'iga eng yaqin masofa (m).
 * a, b koordinatalari [lng, lat] formatda.
 */
export function pointToSegmentMeters(
  p: LatLng,
  a: [number, number],
  b: [number, number],
): number {
  // Equirectangular projection — markaz sifatida courier latitude
  const lat0 = (p.lat * Math.PI) / 180;
  const cosLat0 = Math.cos(lat0);
  const scale = (EARTH_R * Math.PI) / 180;

  const toXY = (lng: number, lat: number): [number, number] => [
    lng * cosLat0 * scale,
    lat * scale,
  ];

  const [px, py] = toXY(p.lng, p.lat);
  const [ax, ay] = toXY(a[0], a[1]);
  const [bx, by] = toXY(b[0], b[1]);

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq < 1e-9) {
    // Degenerate segment — distance to point A
    return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
  }

  // Project P onto AB, clamp t to [0, 1]
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = ax + t * dx;
  const projY = ay + t * dy;

  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

/**
 * Kuryer'dan butun route polyline'iga eng yaqin masofa (m).
 * Barcha segment va ulardagi har bir sub-segmentni tekshiradi.
 */
export function distanceToRoute(p: LatLng, segments: RouteSegment[]): number {
  let minDist = Infinity;
  for (const seg of segments) {
    if (seg.coords.length < 2) continue;
    for (let i = 0; i < seg.coords.length - 1; i++) {
      const d = pointToSegmentMeters(p, seg.coords[i], seg.coords[i + 1]);
      if (d < minDist) minDist = d;
      if (minDist < 1) return minDist; // optimization — yaqin keldi
    }
  }
  return minDist;
}
