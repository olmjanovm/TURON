import {
  DELIVERY_BASE_DISTANCE_METERS,
  DELIVERY_BASE_FEE,
  DELIVERY_EXTRA_FEE_PER_KM,
  DELIVERY_FREE_THRESHOLD,
  DELIVERY_PRICING_RULE_CODE,
  RESTAURANT_COORDINATES,
} from '@turon/shared';
import { YandexMapsService } from './yandex-maps.service.js';

interface CoordinatePoint {
  latitude: number;
  longitude: number;
}

export interface DeliveryQuoteInput {
  subtotal: number;
  discountAmount: number;
  destination: CoordinatePoint;
}

export interface DeliveryQuoteResult {
  subtotal: number;
  discountAmount: number;
  merchandiseTotal: number;
  deliveryFee: number;
  totalAmount: number;
  distanceMeters: number;
  etaMinutes: number;
  feeRuleCode: string;
  feeBaseAmount: number;
  feeExtraAmount: number;
  routeSource: 'yandex-distance-matrix' | 'yandex-router' | 'haversine-fallback';
}

const FALLBACK_CITY_SPEED_KMH = 24;
const FALLBACK_MIN_ETA_MINUTES = 5;
const RESTAURANT_POINT = {
  latitude: RESTAURANT_COORDINATES.lat,
  longitude: RESTAURANT_COORDINATES.lng,
};

function roundCurrency(value: number) {
  return Math.max(0, Math.round(value * 100) / 100);
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineDistanceMeters(from: CoordinatePoint, to: CoordinatePoint) {
  const earthRadiusMeters = 6_371_000;
  const latDelta = toRadians(to.latitude - from.latitude);
  const lngDelta = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const haversine =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);

  return Math.max(
    0,
    Math.round(earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))),
  );
}

function fallbackEtaMinutes(distanceMeters: number) {
  if (distanceMeters <= 0) {
    return 0;
  }

  const distanceKm = distanceMeters / 1000;
  return Math.max(Math.ceil((distanceKm / FALLBACK_CITY_SPEED_KMH) * 60), FALLBACK_MIN_ETA_MINUTES);
}

async function resolveDistanceAndEta(destination: CoordinatePoint) {
  if (YandexMapsService.isDistanceMatrixConfigured()) {
    try {
      const matrix = await YandexMapsService.getDistanceMatrix([RESTAURANT_POINT], [destination]);
      const cell = matrix[0]?.[0];

      if (
        cell?.status === 'OK' &&
        typeof cell.distanceMeters === 'number' &&
        typeof cell.etaSeconds === 'number'
      ) {
        return {
          distanceMeters: Math.max(0, Math.round(cell.distanceMeters)),
          etaMinutes: Math.max(Math.ceil(cell.etaSeconds / 60), 0),
          routeSource: 'yandex-distance-matrix' as const,
        };
      }
    } catch {
      // Fall through to router or coordinate fallback.
    }
  }

  if (YandexMapsService.isRouterConfigured()) {
    try {
      const route = await YandexMapsService.getRouteDetails(RESTAURANT_POINT, destination);

      return {
        distanceMeters: Math.max(0, Math.round(route.distanceMeters)),
        etaMinutes: Math.max(Math.ceil(route.etaSeconds / 60), 0),
        routeSource: 'yandex-router' as const,
      };
    } catch {
      // Fall through to coordinate fallback.
    }
  }

  const distanceMeters = haversineDistanceMeters(RESTAURANT_POINT, destination);

  return {
    distanceMeters,
    etaMinutes: fallbackEtaMinutes(distanceMeters),
    routeSource: 'haversine-fallback' as const,
  };
}

export class DeliveryQuoteService {
  static async calculate(input: DeliveryQuoteInput): Promise<DeliveryQuoteResult> {
    const subtotal = roundCurrency(input.subtotal);
    const discountAmount = roundCurrency(Math.min(Math.max(input.discountAmount, 0), subtotal));
    const merchandiseTotal = roundCurrency(subtotal - discountAmount);
    const { distanceMeters, etaMinutes, routeSource } = await resolveDistanceAndEta(input.destination);

    const feeBaseAmount = merchandiseTotal >= DELIVERY_FREE_THRESHOLD ? 0 : DELIVERY_BASE_FEE;
    const extraDistanceMeters = Math.max(distanceMeters - DELIVERY_BASE_DISTANCE_METERS, 0);
    const extraDistanceKm = extraDistanceMeters > 0 ? Math.ceil(extraDistanceMeters / 1000) : 0;
    const feeExtraAmount = extraDistanceKm * DELIVERY_EXTRA_FEE_PER_KM;
    const deliveryFee = roundCurrency(feeBaseAmount + feeExtraAmount);
    const totalAmount = roundCurrency(merchandiseTotal + deliveryFee);

    return {
      subtotal,
      discountAmount,
      merchandiseTotal,
      deliveryFee,
      totalAmount,
      distanceMeters,
      etaMinutes,
      feeRuleCode: DELIVERY_PRICING_RULE_CODE,
      feeBaseAmount,
      feeExtraAmount,
      routeSource,
    };
  }
}
