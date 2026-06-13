'use client';

/**
 * DeliveryNavigator (FIELD-GRADE)
 *
 * Haqiqiy kuryer ish sharoiti uchun mustahkam navigatsiya.
 *
 *  YANGI FIELD-GRADE YANGILANISHLAR:
 *  • Kalman filter — GPS jitter yo'qoladi (bino ichida sakrash)
 *  • Internal watchPosition — parent prop bo'lmasa ham GPS lock
 *  • Battery throttle — sekin tezlikda tick chastotasi pasayadi
 *  • Offline cache (localStorage) — tarmoq uzilsa marshrut saqlanadi
 *  • Hyper-zoom — 100m radiusda zoom 19 + top-down (azimuth 0)
 *  • Map persistent — parent re-render xaritani dispose qilmaydi
 *  • HW-acceleration hints — will-change, backface-visibility
 *
 *  Saqlangan: TTS (Uzbek), speed radar, custom traffic polylines,
 *  silent compass, 3s autofocus, slide-to-confirm (64px gloves), PiP.
 *  O'chirilgan: Day/Night auto.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronsRight,
  Gauge,
  Loader2,
  PictureInPicture2,
  RotateCcw,
  Volume2,
  VolumeX,
  WifiOff,
  X,
} from 'lucide-react';
import {
  loadYandexMaps,
  type LatLng,
  type Ymaps,
  type YmapInstance,
  type YmapObject,
} from '@/lib/yandex-maps';
import {
  fetchRoute,
  trafficColor,
  type RouteManeuver,
  type RouteResult,
  type RouteSegment,
} from '@/lib/route-fetcher';
import { speak, beep, maneuverPhrase, setVoiceEnabled, isVoiceEnabled } from '@/lib/nav-audio';
import { pipManager } from '@/lib/pip-manager';
import { GpsWatcher, type GpsTick } from '@/lib/gps-watcher';
import { PositionSmoother } from '@/lib/kalman-filter';

export type VehicleMode = 'auto' | 'bicycle' | 'pedestrian';

interface DeliveryNavigatorProps {
  pickup: LatLng;
  destination: LatLng;
  /** Parent-provided GPS. null bo'lsa internal watchPosition ishlaydi. */
  courier?: LatLng | null;
  routeTo: LatLng;
  vehicleMode?: VehicleMode;
  onClose?: () => void;
  orderNumber?: string;
  stageLabel?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmBusy?: boolean;
  /** Internal GPS tick — parent'ga uzatish (Socket emit) */
  onGpsTick?: (tick: GpsTick) => void;
}

const AUTOFOCUS_MS = 3_000;
const PAN_DURATION_MS = 650;
const HEADING_LOW_PASS = 0.22;
const VOICE_THRESHOLDS = [500, 150, 40] as const;
const SPEED_BUFFER_KMH = 10;
const HYPER_ZOOM_RADIUS_M = 100;
const HYPER_ZOOM_LEVEL = 19;
const NORMAL_ZOOM_LEVEL = 17;
const DEFAULT_SPEED_LIMIT: Record<VehicleMode, number> = {
  auto: 60,
  bicycle: 25,
  pedestrian: 6,
};

function deltaAngle(a: number, b: number): number {
  return ((b - a + 540) % 360) - 180;
}
function haversineM(a: LatLng, b: LatLng): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(x));
}
function formatTime(secondsAhead: number): string {
  const eta = new Date(Date.now() + secondsAhead * 1000);
  return `${eta.getHours().toString().padStart(2, '0')}:${eta.getMinutes().toString().padStart(2, '0')}`;
}
function formatDist(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}
function formatDur(s: number): string {
  if (s < 60) return `${Math.round(s)} s`;
  if (s < 3600) return `${Math.round(s / 60)} daq`;
  return `${Math.floor(s / 3600)}s ${Math.round((s % 3600) / 60)}d`;
}
function maneuverIcon(type: string): typeof ArrowUp {
  const t = type.toLowerCase();
  if (t.includes('left')) return ArrowLeft;
  if (t.includes('right')) return ArrowRight;
  if (t.includes('roundabout') || t.includes('u-turn') || t.includes('uturn')) return RotateCcw;
  return ArrowUp;
}
function maneuverLabel(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('sharp-left') || t.includes('sharp_left')) return 'Keskin chapga';
  if (t.includes('sharp-right') || t.includes('sharp_right')) return "Keskin o'ngga";
  if (t.includes('slight-left') || t.includes('slight_left')) return 'Engil chapga';
  if (t.includes('slight-right') || t.includes('slight_right')) return "Engil o'ngga";
  if (t.includes('left')) return 'Chapga';
  if (t.includes('right')) return "O'ngga";
  if (t.includes('roundabout')) return 'Aylanma';
  if (t.includes('u-turn') || t.includes('uturn')) return 'Orqaga';
  return "To'g'ri";
}

export function DeliveryNavigator(props: DeliveryNavigatorProps) {
  const {
    pickup, destination, courier: courierProp, routeTo,
    vehicleMode = 'auto', onClose, orderNumber, stageLabel,
    confirmLabel, onConfirm, confirmBusy, onGpsTick,
  } = props;

  // Persistent refs — parent re-render xaritani dispose qilmaydi
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<YmapInstance | null>(null);
  const ymapsRef = useRef<Ymaps | null>(null);
  const courierMarkerRef = useRef<YmapObject | null>(null);
  const polylineGroupRef = useRef<YmapObject[]>([]);
  const snapDotRef = useRef<YmapObject | null>(null);

  const interactingRef = useRef(false);
  const autofocusTimerRef = useRef<number | null>(null);
  const headingRef = useRef(0);
  const compassListenerCleanupRef = useRef<(() => void) | null>(null);
  const compassRequestedRef = useRef(false);
  const hyperZoomActiveRef = useRef(false);

  const propSmootherRef = useRef(new PositionSmoother());
  const internalWatcherRef = useRef<GpsWatcher | null>(null);
  const spokenManeuversRef = useRef<Set<string>>(new Set());

  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [nextManeuver, setNextManeuver] = useState<RouteManeuver | null>(null);
  const [maneuverDistance, setManeuverDistance] = useState<number | null>(null);
  const [internalCourier, setInternalCourier] = useState<LatLng | null>(null);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number | null>(null);
  const [voiceOn, setVoiceOn] = useState<boolean>(isVoiceEnabled());
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [pipOpen, setPipOpen] = useState(false);
  const pipContentRef = useRef<HTMLDivElement | null>(null);

  // Smoothed courier — parent > internal
  const smoothedCourier = useMemo<LatLng | null>(() => {
    if (courierProp) {
      const s = propSmootherRef.current.smooth(courierProp.lat, courierProp.lng, 10);
      return s;
    }
    return internalCourier;
  }, [courierProp?.lat, courierProp?.lng, internalCourier]);

  const currentSpeedLimit = useMemo<number>(() => {
    if (!route || !smoothedCourier) return DEFAULT_SPEED_LIMIT[vehicleMode];
    let nearest: RouteSegment | null = null;
    let bestDist = Infinity;
    for (const seg of route.segments) {
      if (seg.coords.length === 0) continue;
      const mid = seg.coords[Math.floor(seg.coords.length / 2)];
      const d = haversineM(smoothedCourier, { lat: mid[1], lng: mid[0] });
      if (d < bestDist) { bestDist = d; nearest = seg; }
    }
    return nearest?.speedLimitKmh && nearest.speedLimitKmh > 0
      ? nearest.speedLimitKmh
      : DEFAULT_SPEED_LIMIT[vehicleMode];
  }, [route, smoothedCourier?.lat, smoothedCourier?.lng, vehicleMode]);

  const overSpeedLimit = useMemo(
    () => currentSpeedKmh != null && currentSpeedKmh > currentSpeedLimit + SPEED_BUFFER_KMH,
    [currentSpeedKmh, currentSpeedLimit],
  );

  // Polyline rendering
  const renderPolylines = useCallback((segments: RouteSegment[]) => {
    const map = mapRef.current;
    const ymaps = ymapsRef.current;
    if (!map || !ymaps) return;

    polylineGroupRef.current.forEach((p) => {
      try { map.geoObjects.remove(p); } catch {/* */}
    });
    polylineGroupRef.current = [];

    segments.forEach((seg) => {
      if (seg.coords.length < 2) return;
      const latLngCoords = seg.coords.map(([lng, lat]) => [lat, lng] as number[]);
      const color = trafficColor(seg.traffic);

      const outline = new ymaps.Polyline(latLngCoords as number[][], {}, {
        strokeColor: '#ffffff', strokeWidth: 9, strokeOpacity: 0.7, zIndex: 400,
      });
      map.geoObjects.add(outline);
      polylineGroupRef.current.push(outline);

      const mainLine = new ymaps.Polyline(latLngCoords as number[][], {}, {
        strokeColor: color, strokeWidth: 6.5, strokeOpacity: 1, zIndex: 401,
      });
      map.geoObjects.add(mainLine);
      polylineGroupRef.current.push(mainLine);
    });
  }, []);

  const renderSnapDot = useCallback((coords: [number, number]) => {
    const map = mapRef.current;
    const ymaps = ymapsRef.current;
    if (!map || !ymaps) return;
    try { if (snapDotRef.current) map.geoObjects.remove(snapDotRef.current); } catch {/* */}
    const DotLayout = ymaps.templateLayoutFactory!.createClass('<div class="nav-snap-dot"></div>');
    const dot = new ymaps.Placemark([coords[1], coords[0]], {}, {
      iconLayout: DotLayout as unknown as string,
      iconShape: { type: 'Circle', coordinates: [0, 0], radius: 9 },
      zIndex: 500, cursor: 'arrow',
    });
    map.geoObjects.add(dot);
    snapDotRef.current = dot;
  }, []);

  const refreshRoute = useCallback(async (from: LatLng, to: LatLng) => {
    const ymaps = ymapsRef.current;
    if (!ymaps) return;
    const result = await fetchRoute(from, to, vehicleMode, ymaps);
    if (!result) return;
    setRoute(result);
    renderPolylines(result.segments);
    renderSnapDot(result.snappedStart);
  }, [vehicleMode, renderPolylines, renderSnapDot]);

  // Map mount — bir marta, parent re-render xaritani buzmaydi
  useEffect(() => {
    let cancelled = false;

    loadYandexMaps()
      .then((ymaps) => {
        if (cancelled || !containerRef.current) return;
        ymapsRef.current = ymaps;

        const center = courierProp ?? pickup;
        const map = new ymaps.Map(containerRef.current, {
          center: [center.lat, center.lng],
          zoom: NORMAL_ZOOM_LEVEL,
          controls: [],
          type: 'yandex#map',
        }, {
          suppressMapOpenBlock: true,
          yandexMapDisablePoiInteractivity: true,
          copyrightUaVisible: false,
          copyrightLogoVisible: false,
          copyrightProvidersVisible: false,
          minZoom: 4, maxZoom: 21,
        } as Record<string, unknown>);
        mapRef.current = map;

        const CourierArrowLayout = ymaps.templateLayoutFactory!.createClass([
          '<div class="navigator-arrow-wrap" style="transform: rotate({{ properties.iconRotateAngle }}deg);">',
          '<svg viewBox="0 0 48 60" width="48" height="60" xmlns="http://www.w3.org/2000/svg">',
          '<defs><linearGradient id="navArrG" x1="0" y1="0" x2="0" y2="1">',
          '<stop offset="0%" stop-color="#fb923c"/><stop offset="100%" stop-color="#9a3412"/>',
          '</linearGradient>',
          '<filter id="navArrS" x="-50%" y="-50%" width="200%" height="200%">',
          '<feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.7)"/>',
          '</filter></defs>',
          '<circle cx="24" cy="46" r="9" fill="rgba(251,146,60,0.25)"/>',
          '<path d="M 24 3 L 44 52 L 24 40 L 4 52 Z" fill="url(#navArrG)" stroke="#fff" stroke-width="3" stroke-linejoin="round" filter="url(#navArrS)"/>',
          '<circle cx="24" cy="28" r="4" fill="#fff"/>',
          '</svg></div>',
        ].join(''));

        const courierMarker = new ymaps.Placemark(
          [(courierProp ?? pickup).lat, (courierProp ?? pickup).lng],
          { iconRotateAngle: 0 },
          {
            iconLayout: CourierArrowLayout as unknown as string,
            iconShape: { type: 'Rectangle', coordinates: [[-24, -30], [24, 30]] },
            zIndex: 1000, cursor: 'arrow',
          },
        );
        map.geoObjects.add(courierMarker);
        courierMarkerRef.current = courierMarker;

        const PickupLayout = ymaps.templateLayoutFactory!.createClass(
          '<div class="nav-pin nav-pin-pickup">' +
            '<svg width="38" height="46" viewBox="0 0 36 44"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z" fill="#f59e0b" stroke="#fff" stroke-width="3"/><circle cx="18" cy="18" r="6" fill="#fff"/></svg></div>',
        );
        map.geoObjects.add(new ymaps.Placemark([pickup.lat, pickup.lng], { hintContent: 'Restoran' }, {
          iconLayout: PickupLayout as unknown as string,
          iconShape: { type: 'Rectangle', coordinates: [[-19, -46], [19, 0]] },
          zIndex: 700,
        }));

        const DestLayout = ymaps.templateLayoutFactory!.createClass(
          '<div class="nav-pin nav-pin-dest">' +
            '<svg width="38" height="46" viewBox="0 0 36 44"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z" fill="#c62020" stroke="#fff" stroke-width="3"/><path d="M12 19v-3l6-5 6 5v3h-2v6h-3v-4h-2v4h-3v-6z" fill="#fff"/></svg></div>',
        );
        map.geoObjects.add(new ymaps.Placemark([destination.lat, destination.lng], { hintContent: 'Mijoz' }, {
          iconLayout: DestLayout as unknown as string,
          iconShape: { type: 'Rectangle', coordinates: [[-19, -46], [19, 0]] },
          zIndex: 700,
        }));

        const onInteract = () => {
          interactingRef.current = true;
          if (autofocusTimerRef.current != null) window.clearTimeout(autofocusTimerRef.current);
          autofocusTimerRef.current = window.setTimeout(() => {
            interactingRef.current = false;
            const marker = courierMarkerRef.current;
            const m = mapRef.current;
            if (!marker || !m) return;
            const coords = marker.geometry?.getCoordinates?.();
            if (coords) void m.panTo(coords, { flying: true, duration: PAN_DURATION_MS });
          }, AUTOFOCUS_MS);
        };
        map.events.add(['actionbegin', 'wheel'], onInteract);

        setMapReady(true);

        const from = courierProp ?? pickup;
        void refreshRoute(from, routeTo);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Xaritani yuklab bo'lmadi");
      });

    return () => {
      cancelled = true;
      if (autofocusTimerRef.current != null) window.clearTimeout(autofocusTimerRef.current);
      compassListenerCleanupRef.current?.();
      compassListenerCleanupRef.current = null;
      try { mapRef.current?.destroy(); } catch {/* */}
      mapRef.current = null;
      ymapsRef.current = null;
      courierMarkerRef.current = null;
      polylineGroupRef.current = [];
      snapDotRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Internal GPS watcher (parent prop bo'lmasa)
  useEffect(() => {
    if (courierProp) {
      internalWatcherRef.current?.stop();
      internalWatcherRef.current = null;
      return;
    }
    const watcher = new GpsWatcher();
    internalWatcherRef.current = watcher;
    watcher.start({
      onTick: (tick) => {
        setInternalCourier({ lat: tick.lat, lng: tick.lng });
        if (tick.speedKmh != null) setCurrentSpeedKmh(Math.round(tick.speedKmh));
        onGpsTick?.(tick);
      },
      onError: () => {/* permission/timeout — UI'da emas */},
    });
    return () => {
      watcher.stop();
      internalWatcherRef.current = null;
    };
  }, [courierProp != null, onGpsTick]);

  // Online/offline
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Refresh route on courier change
  useEffect(() => {
    if (!mapReady || !smoothedCourier) return;
    void refreshRoute(smoothedCourier, routeTo);
  }, [mapReady, smoothedCourier?.lat, smoothedCourier?.lng, routeTo.lat, routeTo.lng, refreshRoute]);

  // Courier marker + autofocus + HYPER-ZOOM
  useEffect(() => {
    if (!smoothedCourier) return;
    const marker = courierMarkerRef.current;
    const map = mapRef.current;
    if (!marker || !map) return;

    marker.geometry?.setCoordinates?.([smoothedCourier.lat, smoothedCourier.lng]);

    const distToDest = haversineM(smoothedCourier, destination);
    const shouldHyperZoom = distToDest <= HYPER_ZOOM_RADIUS_M;
    const mapWithExt = map as YmapInstance & {
      setAzimuth?: (a: number, opts?: { duration?: number }) => void;
    };

    if (shouldHyperZoom && !hyperZoomActiveRef.current) {
      hyperZoomActiveRef.current = true;
      try { void map.setZoom(HYPER_ZOOM_LEVEL, { duration: 800 }); } catch {/* */}
      mapWithExt.setAzimuth?.(0, { duration: 800 });
      void speak('Manzilga yaqin keldingiz, kirish joyini topshiring', {
        key: `hyperzoom_${destination.lat}_${destination.lng}`,
      });
    } else if (!shouldHyperZoom && hyperZoomActiveRef.current) {
      hyperZoomActiveRef.current = false;
      try { void map.setZoom(NORMAL_ZOOM_LEVEL, { duration: 600 }); } catch {/* */}
    }

    if (!interactingRef.current) {
      void map.panTo([smoothedCourier.lat, smoothedCourier.lng], {
        flying: true, duration: PAN_DURATION_MS,
      });
    }
  }, [smoothedCourier?.lat, smoothedCourier?.lng, destination.lat, destination.lng]);

  // Speed delta (parent prop based)
  const lastCourierRef = useRef<LatLng | null>(null);
  const lastCourierTsRef = useRef<number>(0);
  useEffect(() => {
    if (!courierProp || !smoothedCourier) return;
    const now = Date.now();
    const prev = lastCourierRef.current;
    const prevTs = lastCourierTsRef.current;
    if (prev && prevTs > 0 && now - prevTs < 30_000 && now - prevTs > 500) {
      const meters = haversineM(prev, smoothedCourier);
      const seconds = (now - prevTs) / 1000;
      const ms = meters / seconds;
      const kmh = Math.round(ms * 3.6);
      if (kmh < 250) setCurrentSpeedKmh(kmh);
    }
    lastCourierRef.current = smoothedCourier;
    lastCourierTsRef.current = now;
  }, [smoothedCourier?.lat, smoothedCourier?.lng, courierProp]);

  // Maneuver + TTS
  useEffect(() => {
    if (!route || !smoothedCourier) {
      setNextManeuver(null);
      setManeuverDistance(null);
      return;
    }
    let bestMan: { m: RouteManeuver; idx: number; dist: number } | null = null;
    for (let i = 0; i < route.maneuvers.length; i++) {
      const m = route.maneuvers[i];
      const d = haversineM(smoothedCourier, { lat: m.coords[1], lng: m.coords[0] });
      if (bestMan == null || d < bestMan.dist) bestMan = { m, idx: i, dist: d };
    }
    setNextManeuver(bestMan?.m ?? null);
    setManeuverDistance(bestMan ? Math.round(bestMan.dist) : null);

    if (bestMan && bestMan.dist <= 800) {
      for (const threshold of VOICE_THRESHOLDS) {
        if (bestMan.dist <= threshold && bestMan.dist >= threshold - 50) {
          const key = `${bestMan.idx}_${threshold}`;
          if (!spokenManeuversRef.current.has(key)) {
            spokenManeuversRef.current.add(key);
            void speak(maneuverPhrase(bestMan.m.type, threshold), { key });
            break;
          }
        }
      }
    }
  }, [route, smoothedCourier?.lat, smoothedCourier?.lng]);

  // Arrival voice
  useEffect(() => {
    if (!smoothedCourier) return;
    const distToDest = haversineM(smoothedCourier, routeTo);
    if (distToDest < 30) {
      void speak('Siz manzilga yetib keldingiz', { key: `arrived_${routeTo.lat}_${routeTo.lng}` });
    }
  }, [smoothedCourier?.lat, smoothedCourier?.lng, routeTo.lat, routeTo.lng]);

  // Speed radar beep
  useEffect(() => {
    if (overSpeedLimit) beep(1100, 220);
  }, [overSpeedLimit]);

  // Silent compass
  const attachCompass = useCallback(() => {
    if (compassListenerCleanupRef.current) return;
    let raf: number | null = null;

    const handler = (e: DeviceOrientationEvent) => {
      // Hyper-zoom: xarita aylanmasin (top-down)
      if (hyperZoomActiveRef.current) return;

      const eAny = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
      let raw: number | null = null;
      if (typeof eAny.webkitCompassHeading === 'number') raw = eAny.webkitCompassHeading;
      else if (e.alpha != null) raw = 360 - e.alpha;
      if (raw == null) return;
      raw = ((raw % 360) + 360) % 360;
      const current = headingRef.current;
      const delta = deltaAngle(current, raw);
      const next = ((current + delta * HEADING_LOW_PASS) + 360) % 360;
      headingRef.current = next;

      if (raf == null) {
        raf = window.requestAnimationFrame(() => {
          raf = null;
          const marker = courierMarkerRef.current;
          marker?.properties?.set?.('iconRotateAngle', headingRef.current);
          const map = mapRef.current as
            | (YmapInstance & { setAzimuth?: (a: number, opts?: { duration?: number }) => void })
            | null;
          map?.setAzimuth?.(headingRef.current, { duration: 200 });
        });
      }
    };

    let absoluteAdded = false;
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute' as keyof WindowEventMap, handler as EventListener);
      absoluteAdded = true;
    }
    window.addEventListener('deviceorientation', handler);

    compassListenerCleanupRef.current = () => {
      if (raf != null) cancelAnimationFrame(raf);
      if (absoluteAdded) {
        window.removeEventListener(
          'deviceorientationabsolute' as keyof WindowEventMap,
          handler as EventListener,
        );
      }
      window.removeEventListener('deviceorientation', handler);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };

    const silentRequest = async () => {
      if (compassRequestedRef.current) return;
      compassRequestedRef.current = true;
      if (typeof DOE?.requestPermission === 'function') {
        try {
          const result = await DOE.requestPermission();
          if (result === 'granted') attachCompass();
        } catch {/* */}
      } else {
        attachCompass();
      }
    };

    const onceHandler = () => {
      void silentRequest();
      window.removeEventListener('pointerdown', onceHandler);
      window.removeEventListener('touchstart', onceHandler);
    };
    window.addEventListener('pointerdown', onceHandler, { once: true, passive: true });
    window.addEventListener('touchstart', onceHandler, { once: true, passive: true });

    if (typeof DOE?.requestPermission !== 'function') {
      attachCompass();
      compassRequestedRef.current = true;
    }

    return () => {
      window.removeEventListener('pointerdown', onceHandler);
      window.removeEventListener('touchstart', onceHandler);
    };
  }, [attachCompass]);

  // PiP
  useEffect(() => {
    const unsub = pipManager.subscribe((s) => setPipOpen(s.open));
    return () => {
      unsub();
      pipManager.close();
    };
  }, []);

  const togglePip = useCallback(async () => {
    if (pipManager.isOpen()) {
      pipManager.close();
      return;
    }
    const content = pipContentRef.current?.cloneNode(true) as HTMLElement | null;
    if (!content) return;
    const ok = await pipManager.openDocument(content);
    if (!ok) {
      await pipManager.openCanvas((ctx, w, h) => {
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(nextManeuver ? maneuverLabel(nextManeuver.type) : 'TURON', w / 2, h / 2 - 10);
        ctx.font = 'bold 32px sans-serif';
        ctx.fillStyle = '#fb923c';
        ctx.fillText(maneuverDistance != null ? `${maneuverDistance} m` : '—', w / 2, h / 2 + 30);
      });
    }
  }, [nextManeuver, maneuverDistance]);

  const toggleVoice = useCallback(() => {
    const next = !voiceOn;
    setVoiceOn(next);
    setVoiceEnabled(next);
  }, [voiceOn]);

  const ManeuverIcon = nextManeuver ? maneuverIcon(nextManeuver.type) : null;
  const maneuverText = nextManeuver ? maneuverLabel(nextManeuver.type) : null;
  const isOfflineRoute = route?.source === 'cache';

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0a0c]" data-no-ptr="true">
      <div className="map-3d-wrap absolute inset-0">
        <div ref={containerRef} className="map-base map-night-filter h-full w-full" />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background:
            'radial-gradient(ellipse at 50% 65%, transparent 0%, transparent 35%, rgba(10,10,12,0.5) 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-24"
        style={{ background: 'linear-gradient(to bottom, rgba(10,10,12,0.85), transparent)' }}
      />

      {!mapReady && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0a0a0c]/90">
          <Loader2 size={32} className="animate-spin text-amber-400" />
        </div>
      )}

      {error && (
        <div className="absolute inset-x-4 top-20 z-30 rounded-2xl bg-red-500/95 p-4 text-center text-sm font-bold text-white">
          {error}
        </div>
      )}

      <div
        className="pointer-events-auto absolute inset-x-0 z-20 mx-auto flex w-full max-w-[480px] items-start justify-between gap-2 px-4 pt-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <SpeedRadar currentKmh={currentSpeedKmh} limitKmh={currentSpeedLimit} overLimit={overSpeedLimit} />

        {orderNumber && (
          <div className="rounded-2xl bg-white/95 px-3 py-1.5 shadow-2xl shadow-black/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {vehicleMode === 'pedestrian' ? 'Piyoda' : vehicleMode === 'bicycle' ? 'Skuter' : 'Mashina'}
              {route?.source === 'yandex-http' && <span className="ml-1 text-emerald-500">●</span>}
              {isOfflineRoute && <span className="ml-1 text-amber-500">●</span>}
            </p>
            <p className="text-sm font-black leading-tight text-slate-900">#{orderNumber}</p>
          </div>
        )}

        <div className="flex flex-col items-end gap-1.5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/95 text-slate-900 shadow-2xl shadow-black/60 active:scale-95"
              aria-label="Yopish"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={toggleVoice}
            className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-2xl shadow-black/60 active:scale-95 ${
              voiceOn ? 'bg-emerald-500 text-white' : 'bg-white/95 text-slate-500'
            }`}
            aria-label="Voice"
          >
            {voiceOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          {pipManager.isSupported() && (
            <button
              type="button"
              onClick={togglePip}
              className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-2xl shadow-black/60 active:scale-95 ${
                pipOpen ? 'bg-amber-500 text-white' : 'bg-white/95 text-slate-700'
              }`}
              aria-label="PiP"
            >
              <PictureInPicture2 size={15} />
            </button>
          )}
        </div>
      </div>

      {!isOnline && (
        <div
          className="pointer-events-auto absolute left-1/2 z-20 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-amber-500/95 px-3 py-1.5 shadow-2xl"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 62px)' }}
        >
          <WifiOff size={12} className="text-white" />
          <span className="text-[11px] font-black uppercase tracking-wider text-white">
            Oflayn — keshlangan marshrut
          </span>
        </div>
      )}

      {nextManeuver && ManeuverIcon && (
        <div
          ref={pipContentRef}
          className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 90px)' }}
        >
          <div className="flex items-center gap-3 rounded-3xl bg-white/95 px-4 py-3 shadow-2xl shadow-black/70 backdrop-blur">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
              <ManeuverIcon size={30} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Keyingi</p>
              <p className="text-lg font-black leading-tight text-slate-900">{maneuverText}</p>
              {maneuverDistance != null && (
                <p className="text-sm font-bold text-[#c62020]">
                  {maneuverDistance < 50 ? 'Hozir' : `${maneuverDistance} m`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {route && mapReady && (
        <NavigatorHUD
          distanceMeters={route.totalDistanceMeters}
          durationSec={route.totalDurationSec}
          stageLabel={stageLabel}
          segments={route.segments}
          confirmLabel={confirmLabel}
          onConfirm={onConfirm}
          confirmBusy={confirmBusy}
        />
      )}

      <style jsx global>{`
        .map-3d-wrap { perspective: 1400px; perspective-origin: 50% 65%; }
        .map-base {
          transform: rotateX(45deg) translateZ(0);
          transform-origin: 50% 65%;
          transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .map-night-filter {
          filter: invert(0.92) hue-rotate(190deg) saturate(0.85) brightness(1.05) contrast(1.05);
        }
        .map-base ymaps[class*="copyright"],
        .map-base ymaps[class*="controls__toolbar"] { display: none !important; }

        .navigator-arrow-wrap {
          width: 48px;
          height: 60px;
          transform-origin: 50% 60%;
          transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
          backface-visibility: hidden;
        }
        .nav-pin {
          width: 38px; height: 46px;
          transform: translate(-19px, -46px);
          filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.55));
        }
        .nav-snap-dot {
          width: 18px; height: 18px;
          border-radius: 9999px;
          background: #3b82f6;
          border: 3px solid #fff;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25), 0 4px 12px rgba(0, 0, 0, 0.55);
          transform: translate(-9px, -9px);
        }
        @keyframes radarPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.85); }
          50% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
        }
        .radar-flashing { animation: radarPulse 0.9s ease-out infinite; }
      `}</style>
    </div>
  );
}

function SpeedRadar({
  currentKmh, limitKmh, overLimit,
}: {
  currentKmh: number | null;
  limitKmh: number;
  overLimit: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`relative flex h-14 w-14 items-center justify-center rounded-full border-4 bg-white text-slate-900 shadow-2xl ${
          overLimit ? 'border-red-500 radar-flashing' : 'border-red-400'
        }`}
        title={`Tezlik chegarasi: ${limitKmh} km/h`}
      >
        <span className="text-lg font-black tabular-nums leading-none">{limitKmh}</span>
      </div>
      <div
        className={`rounded-xl px-2 py-0.5 text-center shadow-lg ${
          overLimit ? 'bg-red-500 text-white' : 'bg-[#0a0a0c]/85 text-white'
        }`}
      >
        <p className="text-[8px] font-bold uppercase tracking-wider opacity-80">Tezlik</p>
        <p className="text-sm font-black tabular-nums leading-tight">
          {currentKmh != null ? `${currentKmh}` : '—'}
        </p>
      </div>
    </div>
  );
}

function NavigatorHUD({
  distanceMeters, durationSec, stageLabel, segments,
  confirmLabel, onConfirm, confirmBusy,
}: {
  distanceMeters: number;
  durationSec: number;
  stageLabel?: string;
  segments: RouteSegment[];
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmBusy?: boolean;
}) {
  const eta = formatTime(durationSec);
  const trafficGradient = useMemo(() => {
    if (segments.length === 0) return 'linear-gradient(to right, #22c55e, #eab308, #ef4444)';
    const stops: string[] = [];
    let acc = 0;
    const totalLen = segments.reduce((s, x) => s + Math.max(1, x.coords.length), 0);
    segments.forEach((seg) => {
      const len = Math.max(1, seg.coords.length);
      const start = (acc / totalLen) * 100;
      acc += len;
      const end = (acc / totalLen) * 100;
      const color = trafficColor(seg.traffic);
      stops.push(`${color} ${start.toFixed(1)}% ${end.toFixed(1)}%`);
    });
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }, [segments]);

  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[480px]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="h-1.5 w-full overflow-hidden" style={{ background: trafficGradient }} />

      <div className="bg-[#0f0f12] px-5 pb-3 pt-3 text-white shadow-[0_-12px_24px_-4px_rgba(0,0,0,0.6)]">
        {stageLabel && (
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            {stageLabel}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8">
              <Gauge size={14} className="text-white/70" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Masofa</p>
              <p className="text-base font-black tabular-nums leading-tight">{formatDist(distanceMeters)}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Yetib boradi</p>
            <p className="text-2xl font-black tabular-nums leading-tight">{eta}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Vaqt</p>
            <p className="text-base font-black tabular-nums leading-tight">{formatDur(durationSec)}</p>
          </div>
        </div>

        {confirmLabel && onConfirm && (
          <div className="mt-3">
            <SlideToConfirm label={confirmLabel} busy={confirmBusy} onConfirm={onConfirm} />
          </div>
        )}
      </div>
    </div>
  );
}

function SlideToConfirm({
  label, onConfirm, busy,
}: {
  label: string;
  onConfirm: () => void;
  busy?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const KNOB = 64; // gloves-friendly
  const TH = 0.85;

  const setP = (p: number) => {
    progressRef.current = p;
    setProgress(p);
  };
  const maxTravel = () => Math.max(40, (trackRef.current?.clientWidth ?? 320) - KNOB - 8);

  const onStart = (clientX: number) => {
    if (busy) return;
    draggingRef.current = true;
    startXRef.current = clientX;
  };
  const onMove = (clientX: number) => {
    if (!draggingRef.current) return;
    const dx = clientX - startXRef.current;
    setP(Math.max(0, Math.min(1, dx / maxTravel())));
  };
  const onEnd = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (progressRef.current >= TH) {
      setP(1);
      try {
        const tg = (window as Window & { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred?: (s: string) => void } } } })
          .Telegram?.WebApp?.HapticFeedback;
        tg?.impactOccurred?.('heavy');
      } catch {/* */}
      onConfirm();
    } else {
      setP(0);
    }
  };

  useEffect(() => {
    if (!busy) setP(0);
  }, [busy]);

  return (
    <div
      ref={trackRef}
      className="relative w-full overflow-hidden rounded-3xl bg-white/8"
      style={{ height: KNOB + 8, touchAction: 'none', userSelect: 'none' }}
      onPointerDown={(e) => {
        if (busy) return;
        try { (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId); } catch {/* */}
        onStart(e.clientX);
      }}
      onPointerMove={(e) => onMove(e.clientX)}
      onPointerUp={(e) => {
        try { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId); } catch {/* */}
        onEnd();
      }}
      onPointerCancel={onEnd}
      onTouchStart={(e) => onStart(e.touches[0]?.clientX ?? 0)}
      onTouchMove={(e) => {
        if (draggingRef.current && e.cancelable) e.preventDefault();
        onMove(e.touches[0]?.clientX ?? 0);
      }}
      onTouchEnd={onEnd}
      onTouchCancel={onEnd}
    >
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-600 transition-[width] duration-150 ease-out"
        style={{ width: `${4 + progress * 96}%` }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-2 text-center text-[13px] font-black uppercase tracking-wider text-white">
        {busy
          ? <Loader2 size={20} className="animate-spin" />
          : progress === 1
            ? '✓'
            : `▶▶ SURGURIB TASDIQLANG · ${label}`}
      </div>
      <div
        className={`pointer-events-none absolute left-1 top-1 flex items-center justify-center rounded-2xl shadow-xl ${
          progress >= TH ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900'
        }`}
        style={{
          width: KNOB,
          height: KNOB,
          transform: `translateX(${progress * maxTravel()}px)`,
          transition: draggingRef.current
            ? 'none'
            : 'transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {busy
          ? <Loader2 size={28} className="animate-spin" />
          : progress >= TH
            ? <Check size={28} strokeWidth={3} />
            : <ChevronsRight size={28} strokeWidth={3} />}
      </div>
    </div>
  );
}
