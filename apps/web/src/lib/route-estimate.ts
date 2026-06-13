import type { LatLng } from './yandex-maps';

const EARTH_RADIUS_M = 6_371_000;
const AVG_SPEED_KMH = 30; // shahar trafik

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(x));
}

export function estimateRoute(from: LatLng, to: LatLng) {
  const meters = haversineMeters(from, to);
  const km = meters / 1000;
  const minutes = Math.max(1, Math.round((km / AVG_SPEED_KMH) * 60));
  return {
    distanceMeters: meters,
    distanceKm: km,
    etaMinutes: minutes,
    formatted: `${km < 1 ? `${Math.round(meters)} m` : `${km.toFixed(1)} km`} · ~${minutes} daq`,
  };
}
