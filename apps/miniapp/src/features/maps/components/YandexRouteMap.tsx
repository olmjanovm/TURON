import React, { useEffect, useRef, useState } from 'react';
import type { RouteMapProps } from '../MapProvider';
import { fetchRouteDetails } from '../api';
import { getMapAnimationDuration, getMapZoomMargin } from '../performance';
import MockMapComponent from './MockMapComponent';
import { createBoundsFromPins, isYandexMapsEnabled, loadYandexMaps, toYandexCoords } from '../yandex';

const FALLBACK_MESSAGE = 'Demo xarita ishlatilmoqda. Yandex uchun `VITE_MAP_API_KEY` ni sozlang.';

export default function YandexRouteMap({
  pickup,
  destination,
  courierPos,
  routeFrom,
  routeTo,
  height = '60vh',
  className = '',
  onMapReady,
  onRouteInfoChange,
}: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const ymapsRef = useRef<any>(null);
  const routeRef = useRef<any>(null);
  const pickupPlacemarkRef = useRef<any>(null);
  const destinationPlacemarkRef = useRef<any>(null);
  const courierPlacemarkRef = useRef<any>(null);
  const routeRequestIdRef = useRef(0);
  const lastRouteInfoRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(isYandexMapsEnabled());
  const [hasFallback, setHasFallback] = useState(!isYandexMapsEnabled());
  const activeRouteFrom = routeFrom ?? pickup;
  const activeRouteTo = routeTo ?? destination;
  const markerPins = [pickup, destination, courierPos, activeRouteFrom, activeRouteTo];

  const emitRouteInfo = (distance: string, eta: string) => {
    const nextKey = `${distance}|${eta}`;
    if (lastRouteInfoRef.current === nextKey) {
      return;
    }

    lastRouteInfoRef.current = nextKey;
    onRouteInfoChange?.({ distance, eta });
  };

  const fitBounds = (pins: Array<typeof pickup | undefined>) => {
    if (!mapRef.current) {
      return;
    }

    const bounds = createBoundsFromPins(pins.filter((pin): pin is typeof pickup => Boolean(pin)));
    if (!bounds) {
      return;
    }

    mapRef.current.setBounds(bounds, {
      checkZoomRange: true,
      zoomMargin: getMapZoomMargin(60),
      duration: getMapAnimationDuration(200),
    });
  };

  useEffect(() => {
    let isDisposed = false;

    async function initMap() {
      if (!isYandexMapsEnabled()) {
        setHasFallback(true);
        setIsLoading(false);
        return;
      }

      try {
        const ymaps = await loadYandexMaps();

        if (isDisposed || !mapContainerRef.current) {
          return;
        }

        ymapsRef.current = ymaps;

        const map = new ymaps.Map(
          mapContainerRef.current,
          {
            center: toYandexCoords(pickup),
            zoom: 14,
            controls: ['zoomControl'],
          },
          {
            suppressMapOpenBlock: true,
          },
        );

        map.behaviors?.disable?.('scrollZoom');
        map.behaviors?.disable?.('dblClickZoom');
        map.behaviors?.disable?.('rightMouseButtonMagnifier');

        const pickupPlacemark = new ymaps.Placemark(
          toYandexCoords(pickup),
          {
            hintContent: 'Restoran',
            balloonContent: 'Restorandan olib ketish nuqtasi',
          },
          {
            preset: 'islands#greenDotIcon',
          },
        );

        const destinationPlacemark = new ymaps.Placemark(
          toYandexCoords(destination),
          {
            hintContent: 'Mijoz',
            balloonContent: 'Yetkazib berish manzili',
          },
          {
            preset: 'islands#redDotIcon',
          },
        );

        map.geoObjects.add(pickupPlacemark);
        map.geoObjects.add(destinationPlacemark);

        mapRef.current = map;
        pickupPlacemarkRef.current = pickupPlacemark;
        destinationPlacemarkRef.current = destinationPlacemark;

        if (courierPos) {
          const courierPlacemark = new ymaps.Placemark(
            toYandexCoords(courierPos),
            {
              hintContent: 'Kuryer',
              balloonContent: 'Kuryerning joriy joylashuvi',
            },
            {
              preset: 'islands#blueDotIcon',
            },
          );

          map.geoObjects.add(courierPlacemark);
          courierPlacemarkRef.current = courierPlacemark;
        }

        routeRequestIdRef.current += 1;
        const currentRequestId = routeRequestIdRef.current;
        const referencePoints = [toYandexCoords(activeRouteFrom), toYandexCoords(activeRouteTo)];

        try {
          const routeDetails = await fetchRouteDetails(activeRouteFrom, activeRouteTo);

          if (isDisposed || currentRequestId !== routeRequestIdRef.current || !mapRef.current) {
            return;
          }

          emitRouteInfo(routeDetails.distance, routeDetails.eta);

          if (ymaps.Polyline) {
            routeRef.current = new ymaps.Polyline(
              (routeDetails.polyline?.length ? routeDetails.polyline : [activeRouteFrom, activeRouteTo]).map(
                toYandexCoords,
              ),
              {},
              {
                strokeColor: '#f59e0b',
                strokeOpacity: 0.95,
                strokeWidth: 6,
              },
            );

            map.geoObjects.add(routeRef.current);
          }
        } catch {
          if (isDisposed || currentRequestId !== routeRequestIdRef.current || !mapRef.current) {
            return;
          }

          if (ymaps.Polyline) {
            routeRef.current = new ymaps.Polyline(referencePoints, {}, {
              strokeColor: '#f59e0b',
              strokeOpacity: 0.9,
              strokeWidth: 6,
            });

            map.geoObjects.add(routeRef.current);
          }
        }

        fitBounds(markerPins);
        onMapReady?.(map);
      } catch {
        setHasFallback(true);
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    }

    initMap();

    return () => {
      isDisposed = true;
      routeRequestIdRef.current += 1;

      if (mapRef.current) {
        mapRef.current.destroy();
      }

      mapRef.current = null;
      ymapsRef.current = null;
      routeRef.current = null;
      pickupPlacemarkRef.current = null;
      destinationPlacemarkRef.current = null;
      courierPlacemarkRef.current = null;
    };
  }, [onMapReady, onRouteInfoChange]);

  useEffect(() => {
    const ymaps = ymapsRef.current;
    const map = mapRef.current;

    if (!ymaps || !map) {
      return;
    }

    pickupPlacemarkRef.current?.geometry?.setCoordinates?.(toYandexCoords(pickup));
    destinationPlacemarkRef.current?.geometry?.setCoordinates?.(toYandexCoords(destination));

    if (courierPos) {
      if (!courierPlacemarkRef.current) {
        courierPlacemarkRef.current = new ymaps.Placemark(
          toYandexCoords(courierPos),
          {
            hintContent: 'Kuryer',
            balloonContent: 'Kuryerning joriy joylashuvi',
          },
          {
            preset: 'islands#blueDotIcon',
          },
        );

        map.geoObjects.add(courierPlacemarkRef.current);
      } else {
        courierPlacemarkRef.current.geometry?.setCoordinates?.(toYandexCoords(courierPos));
      }
    } else if (courierPlacemarkRef.current) {
      map.geoObjects.remove(courierPlacemarkRef.current);
      courierPlacemarkRef.current = null;
    }

    const requestId = ++routeRequestIdRef.current;

    void fetchRouteDetails(activeRouteFrom, activeRouteTo)
      .then((routeDetails) => {
        if (requestId !== routeRequestIdRef.current || !mapRef.current || !ymaps) {
          return;
        }

        emitRouteInfo(routeDetails.distance, routeDetails.eta);

        if (routeRef.current) {
          map.geoObjects.remove(routeRef.current);
          routeRef.current = null;
        }

        if (ymaps.Polyline) {
          routeRef.current = new ymaps.Polyline(
            (routeDetails.polyline?.length ? routeDetails.polyline : [activeRouteFrom, activeRouteTo]).map(
              toYandexCoords,
            ),
            {},
            {
              strokeColor: '#f59e0b',
              strokeOpacity: 0.95,
              strokeWidth: 6,
            },
          );

          map.geoObjects.add(routeRef.current);
        }

        fitBounds(markerPins);
      })
      .catch(() => {
        if (requestId !== routeRequestIdRef.current || !mapRef.current || !ymaps) {
          return;
        }

        if (routeRef.current) {
          map.geoObjects.remove(routeRef.current);
          routeRef.current = null;
        }

        if (ymaps.Polyline) {
          routeRef.current = new ymaps.Polyline(
            [toYandexCoords(activeRouteFrom), toYandexCoords(activeRouteTo)],
            {},
            {
              strokeColor: '#f59e0b',
              strokeOpacity: 0.9,
              strokeWidth: 6,
            },
          );
          map.geoObjects.add(routeRef.current);
        }

        fitBounds(markerPins);
      });

  }, [
    pickup.lat,
    pickup.lng,
    destination.lat,
    destination.lng,
    activeRouteFrom.lat,
    activeRouteFrom.lng,
    activeRouteTo.lat,
    activeRouteTo.lng,
    courierPos?.lat,
    courierPos?.lng,
  ]);

  if (hasFallback) {
    const markers = [
      { id: 'pickup', position: pickup, label: 'RESTORAN', type: 'PICKUP' as const },
      { id: 'destination', position: destination, label: 'MIJOZ', type: 'DELIVERY' as const },
      ...(courierPos ? [{ id: 'courier', position: courierPos, label: 'KURYER', type: 'COURIER' as const }] : []),
    ];

    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gray-100 shadow-inner ${className}`} style={{ height }}>
        <MockMapComponent
          initialCenter={pickup}
          markers={markers}
          showRoute
          height="100%"
          className="h-full rounded-none border-0"
        />
        <div className="pointer-events-none absolute left-4 right-4 top-4 rounded-2xl bg-slate-900/85 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-white shadow-xl">
          {FALLBACK_MESSAGE}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gray-100 shadow-inner ${className}`} style={{ height }}>
      <div ref={mapContainerRef} className="h-full w-full" />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-lg">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span className="text-sm font-bold text-slate-700">Xarita yuklanmoqda...</span>
          </div>
        </div>
      )}
    </div>
  );
}
