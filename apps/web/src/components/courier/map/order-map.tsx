'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { loadYandexMaps, RESTAURANT_DEFAULT, type LatLng, type YmapInstance, type YmapObject } from '@/lib/yandex-maps';

interface OrderMapProps {
  pickup: LatLng;
  destination: LatLng;
  courier?: LatLng | null;
  routeTo: LatLng; // pickup yoki destination — bosqichga qarab
}

/**
 * Dark navigator-style map for active deliveries.
 * - Pickup (restoran) pin: amber
 * - Destination (mijoz) pin: ember/red
 * - Courier pin: blue (real-time updates)
 * - Live route: courier → routeTo (multiRouter agar bo'lsa, aks holda chiziq)
 * - Past quvvat: 2GB RAM — destroy on unmount, throttle updates
 */
export function OrderMap({ pickup, destination, courier, routeTo }: OrderMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<YmapInstance | null>(null);
  const courierMarkerRef = useRef<YmapObject | null>(null);
  const routeObjectRef = useRef<YmapObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mount map once
  useEffect(() => {
    let cancelled = false;

    loadYandexMaps()
      .then((ymaps) => {
        if (cancelled || !containerRef.current) return;

        const center = courier ?? routeTo;
        const map = new ymaps.Map(
          containerRef.current,
          {
            center: [center.lat, center.lng],
            zoom: 14,
            controls: [],
          },
          { suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true },
        );
        mapRef.current = map;

        // Pickup pin (amber circle with shop icon)
        const pickupPin = new ymaps.Placemark(
          [pickup.lat, pickup.lng],
          { hintContent: 'Restoran', balloonContent: 'Olib chiqish nuqtasi' },
          {
            preset: 'islands#yellowFoodCircleIcon',
            iconColor: '#f59e0b',
          },
        );
        map.geoObjects.add(pickupPin);

        // Destination pin
        const destPin = new ymaps.Placemark(
          [destination.lat, destination.lng],
          { hintContent: 'Mijoz', balloonContent: "Yetkazib berish manzili" },
          {
            preset: 'islands#redHomeCircleIcon',
            iconColor: '#c62020',
          },
        );
        map.geoObjects.add(destPin);

        setLoading(false);

        // Fit bounds to show both points
        const lats = [pickup.lat, destination.lat];
        const lngs = [pickup.lng, destination.lng];
        if (courier) { lats.push(courier.lat); lngs.push(courier.lng); }
        const bounds = [
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)],
        ];
        void map.setBounds(bounds, { checkZoomRange: true, zoomMargin: [80, 40, 220, 40] });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Xaritani yuklashda xato');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      try {
        mapRef.current?.destroy();
      } catch {/* ignore */}
      mapRef.current = null;
      courierMarkerRef.current = null;
      routeObjectRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update courier position (throttled by parent via socket — we just sync DOM)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !courier) return;

    void loadYandexMaps().then((ymaps) => {
      if (!mapRef.current) return;
      if (!courierMarkerRef.current) {
        const pin = new ymaps.Placemark(
          [courier.lat, courier.lng],
          { hintContent: 'Kuryer' },
          {
            preset: 'islands#blueDeliveryCircleIcon',
            iconColor: '#2563eb',
            zIndex: 999,
          },
        );
        mapRef.current.geoObjects.add(pin);
        courierMarkerRef.current = pin;
      } else {
        courierMarkerRef.current.geometry?.setCoordinates?.([courier.lat, courier.lng]);
      }
    });
  }, [courier?.lat, courier?.lng]);

  // Update route line whenever the source/target changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const from = courier ?? pickup;

    void loadYandexMaps().then((ymaps) => {
      if (!mapRef.current) return;
      // Remove previous route
      if (routeObjectRef.current) {
        mapRef.current.geoObjects.remove(routeObjectRef.current);
        routeObjectRef.current = null;
      }

      // Prefer real routing if available; fall back to straight polyline
      if (ymaps.multiRouter) {
        const route = new ymaps.multiRouter.MultiRoute(
          {
            referencePoints: [
              [from.lat, from.lng],
              [routeTo.lat, routeTo.lng],
            ],
            params: { routingMode: 'auto' },
          },
          {
            boundsAutoApply: false,
            wayPointVisible: false,
            routeActiveStrokeColor: '#c62020',
            routeActiveStrokeWidth: 5,
            routeStrokeColor: '#c6202055',
            routeStrokeWidth: 4,
          },
        );
        mapRef.current.geoObjects.add(route);
        routeObjectRef.current = route;
      } else {
        const line = new ymaps.Polyline(
          [
            [from.lat, from.lng],
            [routeTo.lat, routeTo.lng],
          ],
          {},
          { strokeColor: '#c62020', strokeWidth: 4, strokeOpacity: 0.85 },
        );
        mapRef.current.geoObjects.add(line);
        routeObjectRef.current = line;
      }
    });
  }, [courier?.lat, courier?.lng, routeTo.lat, routeTo.lng, pickup.lat, pickup.lng]);

  return (
    <div className="absolute inset-0 bg-[#0d0d0f]">
      <div ref={containerRef} className="h-full w-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d0f]/70 backdrop-blur">
          <Loader2 size={28} className="animate-spin text-amber-400" />
        </div>
      )}
      {error && (
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-2xl bg-red-500/90 p-4 text-center text-sm font-bold text-white">
          {error}
        </div>
      )}
    </div>
  );
}

// Default restaurant if pickup not set on order
export { RESTAURANT_DEFAULT };
