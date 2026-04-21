import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { LocationPickerProps } from '../MapProvider';
import { fetchRouteDetails } from '../api';
import { getRouteSyncDelay } from '../performance';
import { estimateRouteInfo } from '../route';
import { isYandexMaps3Enabled, loadYandexMaps3, toLngLat } from '../yandex3';
import MockMapComponent from './MockMapComponent';

export default function YandexLocationPicker({
  initialCenter,
  onLocationSelect,
  onRouteInfoChange,
  onInteractionStart,
  onInteractionEnd,
  userLocationPin,
  restaurantLocationPin,
  height = '400px',
  className = '',
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const ymaps3Ref = useRef<any>(null);
  const routeFeatureRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const restaurantMarkerRef = useRef<any>(null);
  const listenerRef = useRef<any>(null);
  const routeSyncTimeoutRef = useRef<number | null>(null);
  const routeRequestIdRef = useRef(0);
  const lastRouteInfoRef = useRef<string | null>(null);
  const centerRef = useRef<{ lat: number; lng: number }>(initialCenter);
  const pointerDownRef = useRef(false);
  const handlersRef = useRef({ onInteractionStart, onInteractionEnd, onLocationSelect });
  const yandexExpected = isYandexMaps3Enabled();
  const [isLoading, setIsLoading] = useState(yandexExpected);
  const [hasFallback, setHasFallback] = useState(!yandexExpected);

  // Keep handlers stable via ref
  useEffect(() => {
    handlersRef.current = { onInteractionStart, onInteractionEnd, onLocationSelect };
  }, [onInteractionStart, onInteractionEnd, onLocationSelect]);

  const markerElements = useMemo(() => {
    const createDot = (color: string) => {
      const el = document.createElement('div');
      el.style.cssText =
        'width:18px;height:18px;border-radius:9999px;transform:translate(-50%,-50%);' +
        `background:${color};border:3px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,0.22);`;
      return el;
    };
    return {
      user: createDot('#38BDF8'),
      restaurant: createDot('#10B981'),
    };
  }, []);

  const emitRouteInfo = (distance: string, eta: string) => {
    const nextKey = `${distance}|${eta}`;
    if (lastRouteInfoRef.current === nextKey) {
      return;
    }

    lastRouteInfoRef.current = nextKey;
    onRouteInfoChange?.({ distance, eta });
  };

  const clearRoute = () => {
    const map = mapRef.current;
    if (!map || !routeFeatureRef.current) return;
    try {
      map.removeChild(routeFeatureRef.current);
    } catch {
      // ignore
    }
    routeFeatureRef.current = null;
  };

  const renderRoutePolyline = (coords: Array<{ lat: number; lng: number }>) => {
    const ymaps3 = ymaps3Ref.current;
    const map = mapRef.current;
    if (!ymaps3 || !map) return;

    const coordinates = coords.map((p) => toLngLat(p));
    if (coordinates.length < 2) return;

    if (routeFeatureRef.current) {
      try {
        routeFeatureRef.current.update({
          geometry: { type: 'LineString', coordinates },
        });
        return;
      } catch {
        try {
          map.removeChild(routeFeatureRef.current);
        } catch {
          // ignore
        }
        routeFeatureRef.current = null;
      }
    }

    try {
      const feature = new ymaps3.YMapFeature({
        id: 'customer-route',
        geometry: { type: 'LineString', coordinates },
        style: { stroke: [{ color: '#FFD600', width: 6, opacity: 0.95 }] },
      });
      map.addChild(feature);
      routeFeatureRef.current = feature;
    } catch {
      // ignore
    }
  };

  const syncRoute = async () => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (!restaurantLocationPin) {
      clearRoute();
      return;
    }

    const requestId = ++routeRequestIdRef.current;

    try {
      const routeDetails = await fetchRouteDetails(restaurantLocationPin, initialCenter);

      if (requestId !== routeRequestIdRef.current) {
        return;
      }

      emitRouteInfo(routeDetails.distance, routeDetails.eta);
      renderRoutePolyline(routeDetails.polyline || [restaurantLocationPin, initialCenter]);
    } catch {
      if (requestId !== routeRequestIdRef.current) {
        return;
      }

      const estimatedRouteInfo = estimateRouteInfo(restaurantLocationPin, initialCenter);
      emitRouteInfo(estimatedRouteInfo.distance, estimatedRouteInfo.eta);
      renderRoutePolyline([restaurantLocationPin, initialCenter]);
    }
  };

  const scheduleRouteSync = () => {
    if (routeSyncTimeoutRef.current) {
      window.clearTimeout(routeSyncTimeoutRef.current);
      routeSyncTimeoutRef.current = null;
    }

    const delay = getRouteSyncDelay();
    if (delay === 0) {
      syncRoute();
      return;
    }

    routeSyncTimeoutRef.current = window.setTimeout(() => {
      routeSyncTimeoutRef.current = null;
      syncRoute();
    }, delay);
  };

  useEffect(() => {
    let isDisposed = false;

    async function initMap() {
      if (!yandexExpected) {
        setHasFallback(true);
        setIsLoading(false);
        return;
      }

      try {
        const ymaps3 = await loadYandexMaps3();

        if (isDisposed || !mapContainerRef.current) return;

        ymaps3Ref.current = ymaps3;

        const map = new ymaps3.YMap(mapContainerRef.current, {
          location: { center: toLngLat(initialCenter), zoom: 17 },
          camera: { tilt: 50, azimuth: 0 },
          mode: 'vector',
          behaviors: [
            'drag',
            'pinchZoom',
            'pinchRotate',
            'oneFingerZoom',
            'dblClick',
            'scrollZoom',
            'mouseRotate',
            'mouseTilt',
          ],
        });

        map.addChild(new ymaps3.YMapDefaultSchemeLayer({ theme: 'dark' }));
        if (ymaps3.YMapDefaultFeaturesLayer) {
          map.addChild(new ymaps3.YMapDefaultFeaturesLayer({}));
        }

        try {
          if (ymaps3.YMapControls && ymaps3.YMapZoomControl) {
            const controls = new ymaps3.YMapControls({ position: 'right' });
            controls.addChild(new ymaps3.YMapZoomControl({}));
            map.addChild(controls);
          }
        } catch {
          // optional
        }

        const listener = new ymaps3.YMapListener({
          onUpdate: ({ location }: { location?: { center?: [number, number] } }) => {
            const center = location?.center;
            if (!center || center.length < 2) return;
            // ymaps3: [lng, lat]
            centerRef.current = { lat: center[1], lng: center[0] };
          },
        });
        map.addChild(listener);
        listenerRef.current = listener;

        if (restaurantLocationPin) {
          try {
            const marker = new ymaps3.YMapMarker({ coordinates: toLngLat(restaurantLocationPin), zIndex: 120 }, markerElements.restaurant);
            map.addChild(marker);
            restaurantMarkerRef.current = marker;
          } catch {
            // ignore
          }
        }

        if (userLocationPin) {
          try {
            const marker = new ymaps3.YMapMarker({ coordinates: toLngLat(userLocationPin), zIndex: 130 }, markerElements.user);
            map.addChild(marker);
            userMarkerRef.current = marker;
          } catch {
            // ignore
          }
        }

        mapRef.current = map;
        scheduleRouteSync();
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
        try {
          mapRef.current.destroy();
        } catch {
          // ignore
        }
        mapRef.current = null;
      }

      if (routeSyncTimeoutRef.current) {
        window.clearTimeout(routeSyncTimeoutRef.current);
        routeSyncTimeoutRef.current = null;
      }

      ymaps3Ref.current = null;
      listenerRef.current = null;
      routeFeatureRef.current = null;
      userMarkerRef.current = null;
      restaurantMarkerRef.current = null;
    };
  }, [markerElements.restaurant, markerElements.user, onRouteInfoChange, yandexExpected]);

  useEffect(() => {
    if (!mapRef.current) return;
    scheduleRouteSync();
    try {
      mapRef.current.update({
        location: {
          center: toLngLat(initialCenter),
          zoom: 17,
          duration: 260,
        },
      });
    } catch {
      // ignore
    }
  }, [initialCenter.lat, initialCenter.lng]);

  useEffect(() => {
    const map = mapRef.current;
    const ymaps3 = ymaps3Ref.current;
    if (!map || !ymaps3) return;

    if (!userLocationPin) {
      if (userMarkerRef.current) {
        try { map.removeChild(userMarkerRef.current); } catch { /* ignore */ }
        userMarkerRef.current = null;
      }
      return;
    }

    const coords = toLngLat(userLocationPin);
    if (!userMarkerRef.current) {
      try {
        const marker = new ymaps3.YMapMarker({ coordinates: coords, zIndex: 130 }, markerElements.user);
        map.addChild(marker);
        userMarkerRef.current = marker;
      } catch {
        // ignore
      }
    } else {
      try {
        userMarkerRef.current.update({ coordinates: coords });
      } catch {
        // ignore
      }
    }
  }, [markerElements.user, userLocationPin?.lat, userLocationPin?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    const ymaps3 = ymaps3Ref.current;
    if (!map || !ymaps3) return;

    if (!restaurantLocationPin) {
      if (restaurantMarkerRef.current) {
        try { map.removeChild(restaurantMarkerRef.current); } catch { /* ignore */ }
        restaurantMarkerRef.current = null;
      }
      return;
    }

    const coords = toLngLat(restaurantLocationPin);
    if (!restaurantMarkerRef.current) {
      try {
        const marker = new ymaps3.YMapMarker({ coordinates: coords, zIndex: 120 }, markerElements.restaurant);
        map.addChild(marker);
        restaurantMarkerRef.current = marker;
      } catch {
        // ignore
      }
    } else {
      try {
        restaurantMarkerRef.current.update({ coordinates: coords });
      } catch {
        // ignore
      }
    }

    scheduleRouteSync();
  }, [restaurantLocationPin?.lat, restaurantLocationPin?.lng]);

  if (hasFallback) {
    return (
      <div className="relative" style={{ height }}>
        <MockMapComponent
          initialCenter={initialCenter}
          onLocationSelect={onLocationSelect}
          onRouteInfoChange={onRouteInfoChange}
          onInteractionStart={onInteractionStart}
          onInteractionEnd={onInteractionEnd}
          userLocationPin={userLocationPin}
          restaurantLocationPin={restaurantLocationPin}
          height={height}
          className={className}
        />
        <div className="pointer-events-none absolute left-4 right-4 top-4 rounded-2xl bg-slate-900/85 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-white shadow-xl">
          Demo xarita ishlatilmoqda. Yandex uchun `VITE_MAP_API_KEY` ni sozlang.
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[40px] ${className}`}
      style={{ height }}
      onPointerDown={() => {
        pointerDownRef.current = true;
        handlersRef.current.onInteractionStart?.();
      }}
      onPointerUp={() => {
        if (!pointerDownRef.current) return;
        pointerDownRef.current = false;
        const pin = centerRef.current;
        handlersRef.current.onLocationSelect?.(pin);
        handlersRef.current.onInteractionEnd?.();
      }}
      onPointerCancel={() => {
        pointerDownRef.current = false;
        handlersRef.current.onInteractionEnd?.();
      }}
    >
      <div ref={mapContainerRef} className="h-full w-full" />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="absolute -top-14 left-1/2 flex -translate-x-1/2 flex-col items-center">
            <div className="rounded-full bg-[#ffd600] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_16px_28px_rgba(255,214,0,0.32)]">
              Pin
            </div>
            <div className="h-3 w-[2px] bg-[#ffd600]" />
          </div>
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-[3px] border-white bg-red-500 shadow-lg">
            <div className="h-1.5 w-1.5 rounded-full bg-white" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-lg">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            <span className="text-sm font-bold text-slate-700">Xarita yuklanmoqda...</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
