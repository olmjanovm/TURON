import { useEffect, useRef } from 'react';
import { useCourierStore } from '../store/courierStore';
import { api } from '../lib/api';

/** Haversine formulasi: 2 ta GPS nuqta orasidagi masofani metrda hisoblaydi */
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Yer radiusi (metr)
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const GEOFENCE_RADIUS_METERS = 50; // Yetib kelganlikni tasdiqlash uchun radius
const NOTIFY_RADIUS_METERS = 500;  // Mijozga ogohlantirish yuborish radiusi

export function useGeofence() {
  const { coords, deliveryStage, restaurantCoords, customerCoords, orderId } = useCourierStore();

  // Infinite-loop (API spam) oldini olish uchun triggerlar
  const triggeredRestaurantArrival = useRef(false);
  const triggeredCustomerNotify = useRef(false);
  const triggeredCustomerArrival = useRef(false);

  useEffect(() => {
    if (!coords || !orderId) return;
    const [lng, lat] = coords;

    // 1-BOSQICH: Restoranga ketyapti
    if (deliveryStage === 1 && restaurantCoords) {
      const [rLng, rLat] = restaurantCoords;
      const dist = getDistanceMeters(lat, lng, rLat, rLng);

      // Restoranga 50m qolganda avtomat "ARRIVED_AT_RESTAURANT" signalini beramiz
      if (dist <= GEOFENCE_RADIUS_METERS && !triggeredRestaurantArrival.current) {
        triggeredRestaurantArrival.current = true;
        api.post(`/courier/orders/${orderId}/arrive-restaurant`).catch(console.error);
      }
    }

    // 2-BOSQICH: Mijoz manziliga ketyapti
    if (deliveryStage === 2 && customerCoords) {
      const [cLng, cLat] = customerCoords;
      const dist = getDistanceMeters(lat, lng, cLat, cLng);

      // Mijozga 500 metr qolganda "Kuryer yaqinlashmoqda" deb notification yuboramiz
      if (dist <= NOTIFY_RADIUS_METERS && !triggeredCustomerNotify.current) {
        triggeredCustomerNotify.current = true;
        api.post(`/courier/orders/${orderId}/notify-approaching`).catch(console.error);
      }

      // Mijozga 50 metr qolganda manzilga yetib kelganini qayd etamiz
      if (dist <= GEOFENCE_RADIUS_METERS && !triggeredCustomerArrival.current) {
        triggeredCustomerArrival.current = true;
        api.post(`/courier/orders/${orderId}/arrive-destination`).catch(console.error);
      }
    }
  }, [coords, deliveryStage, restaurantCoords, customerCoords, orderId]);
}