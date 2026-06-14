import type { LatLng } from './yandex-maps';
import { haversineMeters } from './route-geometry';

const AVG_SPEED_KMH = 30; // shahar trafik

export { haversineMeters };

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
