import { useEffect, useRef } from 'react';
import { useCourierStore } from '../store/courierStore';
import { api } from '../lib/api';

/** Haversine — meters between two GPS points. */
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const GEOFENCE_RADIUS_METERS = 50; // "Yetib keldi" radius
const NOTIFY_RADIUS_METERS = 500; // "Yaqinlashmoqda" notification radius

/**
 * Auto-stage transitions based on GPS proximity.
 *
 * Stage 1 (going to restaurant) → fires `arrived-restaurant` when courier
 * enters the 50m geofence around the pickup point. Backend transitions
 * the assignment to ARRIVED_AT_RESTAURANT.
 *
 * Stage 2 (going to customer) → fires:
 *   - `approaching` notification when within 500m
 *   - `arrive-destination` when within 50m
 *
 * IMPORTANT: the URLs below MUST match the backend routes registered in
 * `apps/backend/src/api/modules/courier/courier.routes.ts`. Earlier
 * versions of this hook used `/courier/orders/:id/...` (plural) and
 * `/notify-approaching`/`arrive-restaurant`, which 404'd silently —
 * couriers had to tap every button by hand. Singular `order` and the
 * exact verb names (`arrived-restaurant`, `approaching`) are the
 * source-of-truth.
 */
export function useGeofence() {
  const { coords, deliveryStage, restaurantCoords, customerCoords, orderId } =
    useCourierStore();

  // Per-order triggers — reset when the order changes.
  const triggeredOrderIdRef = useRef<string | null>(null);
  const triggeredRestaurantArrival = useRef(false);
  const triggeredCustomerNotify = useRef(false);
  const triggeredCustomerArrival = useRef(false);

  useEffect(() => {
    if (!orderId) return;
    if (triggeredOrderIdRef.current !== orderId) {
      triggeredOrderIdRef.current = orderId;
      triggeredRestaurantArrival.current = false;
      triggeredCustomerNotify.current = false;
      triggeredCustomerArrival.current = false;
    }
  }, [orderId]);

  useEffect(() => {
    if (!coords || !orderId) return;
    const [lng, lat] = coords;

    // Stage 1 — heading to restaurant
    if (deliveryStage === 1 && restaurantCoords) {
      const [rLng, rLat] = restaurantCoords;
      const dist = getDistanceMeters(lat, lng, rLat, rLng);

      if (dist <= GEOFENCE_RADIUS_METERS && !triggeredRestaurantArrival.current) {
        triggeredRestaurantArrival.current = true;
        api
          .post(`/courier/order/${orderId}/arrived-restaurant`)
          .catch((err) => {
            console.warn('[Geofence] arrived-restaurant failed:', err);
            // Allow retry on the next tick
            triggeredRestaurantArrival.current = false;
          });
      }
    }

    // Stage 2 — heading to customer
    if (deliveryStage === 2 && customerCoords) {
      const [cLng, cLat] = customerCoords;
      const dist = getDistanceMeters(lat, lng, cLat, cLng);

      if (dist <= NOTIFY_RADIUS_METERS && !triggeredCustomerNotify.current) {
        triggeredCustomerNotify.current = true;
        api
          .post(`/courier/order/${orderId}/approaching`)
          .catch((err) => {
            console.warn('[Geofence] approaching failed:', err);
            triggeredCustomerNotify.current = false;
          });
      }

      if (dist <= GEOFENCE_RADIUS_METERS && !triggeredCustomerArrival.current) {
        triggeredCustomerArrival.current = true;
        api
          .post(`/courier/order/${orderId}/arrive-destination`)
          .catch((err) => {
            console.warn('[Geofence] arrive-destination failed:', err);
            triggeredCustomerArrival.current = false;
          });
      }
    }
  }, [coords, deliveryStage, restaurantCoords, customerCoords, orderId]);
}