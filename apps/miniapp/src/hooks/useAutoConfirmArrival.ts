import { useEffect, useRef } from 'react';
import { DeliveryStage } from '../data/types';
import { useUpdateCourierOrderStage } from './queries/useOrders';
import { useCourierStore } from '../store/courierStore';

/** [longitude, latitude] → distance in metres (Haversine) */
function haversineMeters(
  [lon1, lat1]: [number, number],
  [lon2, lat2]: [number, number],
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * GPS-based auto-confirm:
 *  1. Courier comes within 30 m of restaurant  → arrivedRef = true
 *  2. Then moves away past 30 m               → trigger "Restoranda olindi"
 *
 * Fires only once per order. Resets when orderId changes.
 */
export function useAutoConfirmArrival() {
  const coords         = useCourierStore((s) => s.coords);
  const deliveryStage  = useCourierStore((s) => s.deliveryStage);
  const restaurantCoords = useCourierStore((s) => s.restaurantCoords);
  const setDeliveryStage = useCourierStore((s) => s.setDeliveryStage);
  const orderId        = useCourierStore((s) => s.orderId);

  const updateStageMutation = useUpdateCourierOrderStage();

  const prevDistRef   = useRef<number | null>(null);
  const arrivedRef    = useRef(false);
  const departedRef   = useRef(false);
  const firedRef      = useRef(false);

  // Reset tracking state whenever a new order is loaded
  useEffect(() => {
    arrivedRef.current  = false;
    departedRef.current = false;
    firedRef.current    = false;
    prevDistRef.current = null;
  }, [orderId]);

  useEffect(() => {
    if (!coords || !restaurantCoords) return;
    if (deliveryStage !== 1)         return; // only relevant for stage 1
    if (firedRef.current)            return; // already fired once

    const dist = haversineMeters(coords, restaurantCoords);

    // Step 1: arrived at restaurant
    if (dist < 30) {
      arrivedRef.current = true;
    }

    // Step 2: started leaving after having arrived
    if (
      arrivedRef.current &&
      !departedRef.current &&
      prevDistRef.current !== null &&
      dist > prevDistRef.current && // distance is increasing
      dist > 30
    ) {
      departedRef.current = true;
      firedRef.current    = true;

      // Optimistic local update for instant UI feedback
      setDeliveryStage(2);

      // Persist to server
      if (orderId) {
        updateStageMutation.mutate({ id: orderId, stage: DeliveryStage.PICKED_UP });
      }
    }

    prevDistRef.current = dist;
  }, [coords, deliveryStage, orderId, restaurantCoords, setDeliveryStage, updateStageMutation]);
}
