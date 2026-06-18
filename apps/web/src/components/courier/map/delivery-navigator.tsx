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
  Compass,
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
import { distanceToRoute, haversineMeters } from '@/lib/route-geometry';

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
// Kompas silliqlash — adaptiv low-pass (qotgan 0.22 o'rniga: jitter↓ + turn-lag↓)
const HEADING_ALPHA_MIN = 0.15;
const HEADING_ALPHA_MAX = 0.4;
const COMPASS_DEADZONE_DEG = 1.5;      // turganda mikro-jitter'ni e'tiborsiz qoldir
// Kompas DRIFT'ni tuzatish uchun harakatда GPS-yo'nalishiga kuchliroq tortamiz
// ("boshida aniq, keyin noto'g'ri" — magnitometr drifti; GPS course drift qilmaydi).
const GPS_FUSION_MIN_KMH = 8;          // bu tezlikdan yuqorida GPS-bearing fusion yoqiladi
const GPS_FUSION_DISAGREE_DEG = 30;    // kompas GPS'dan shuncha farq qilsa, GPS'ga moyil
const GPS_FUSION_PULL = 0.2;           // GPS course'ga tortish kuchi (drift tuzatish)
const VOICE_THRESHOLDS = [500, 150, 40] as const;
const SPEED_BUFFER_KMH = 10;
const HYPER_ZOOM_RADIUS_M = 100;
const HYPER_ZOOM_LEVEL = 19;
const CHASE_ZOOM_LEVEL = 18;           // chase-cam zoom (boshlang'ich + auto-focus)
// Course-up (CSS): xarita konteyneri rotateZ(ROTATE_SIGN·heading) bilan aylanadi.
// Yandex raster native setAzimuth'ni qo'llamaydi → CSS bilan qilamiz. Yo'nalish
// teskari bo'lsa ROTATE_SIGN'ни +1 ga o'zgartiriladi (1-belgi).
const NAV_TILT_DEG = 40;
const ROTATE_SIGN = -1;
const DEFAULT_SPEED_LIMIT: Record<VehicleMode, number> = {
  auto: 60,
  bicycle: 25,
  pedestrian: 6,
};

// === Dynamic features ===
const DEVIATION_THRESHOLD_M = 50;        // 50m chetga chiqsa → reroute
const REROUTE_COOLDOWN_MS = 5_000;       // 5s ichida ko'p reroute qilmaslik
const TRAFFIC_RECHECK_MS = 120_000;      // har 2 daq trafik tekshirish
const TRAFFIC_IMPROVEMENT_SEC = 120;     // 2+ daq tezroq bo'lsa swap
const DRIVING_MODE_ENTER_KMH = 15;       // bu tezlikdan keyin driving mode
const DRIVING_MODE_EXIT_KMH = 10;        // bu tezlikdan past bo'lsa chiqamiz (hysteresis)

function deltaAngle(a: number, b: number): number {
  return ((b - a + 540) % 360) - 180;
}
// |delta| kichik → silliq (min alpha), katta burilish → tez (max alpha)
function adaptiveHeadingAlpha(delta: number): number {
  const a = Math.abs(delta);
  const alpha = HEADING_ALPHA_MIN + (a / 60) * (HEADING_ALPHA_MAX - HEADING_ALPHA_MIN);
  return Math.min(HEADING_ALPHA_MAX, Math.max(HEADING_ALPHA_MIN, alpha));
}
// Geometriya — @turf/turf orqali (route-geometry.ts'da)
const haversineM = haversineMeters;

/** Great-circle bearing from→to (degrees clockwise from north). */
function gpsBearing(from: LatLng, to: LatLng): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const f1 = toRad(from.lat);
  const f2 = toRad(to.lat);
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(f2);
  const x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
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
// Ovoz uchun masofa prefiksi (maneuverPhrase bilan bir xil bosqichlar).
function distancePrefixUz(d: number): string {
  if (d < 50) return 'Hozir';
  if (d < 150) return '100 metrdan keyin';
  if (d < 600) return `${Math.round(d / 100) * 100} metrdan keyin`;
  return `${(d / 1000).toFixed(1)} kilometrdan keyin`;
}
// Yandex'ning ko'cha-nomli instruction matnidan foydalanamiz (lang=uz_UZ);
// bo'lmasa — eski type asosidagi maneuverPhrase'ga qaytamiz (regressiya yo'q).
function maneuverVoice(man: RouteManeuver, distance: number): string {
  const instr = man.instruction?.trim();
  return instr ? `${distancePrefixUz(distance)} ${instr}` : maneuverPhrase(man.type, distance);
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
  const fallbackLineRef = useRef<YmapObject | null>(null);
  const snapDotRef = useRef<YmapObject | null>(null);
  const maneuverArrowsRef = useRef<YmapObject[]>([]);
  const trafficProviderRef = useRef<{ setMap: (m: unknown) => void } | null>(null);

  const interactingRef = useRef(false);
  const autofocusTimerRef = useRef<number | null>(null);
  const headingRef = useRef(0);
  const compassListenerCleanupRef = useRef<(() => void) | null>(null);
  const compassRequestedRef = useRef(false);
  const hyperZoomActiveRef = useRef(false);
  // Compass — robustlik uchun
  const absoluteFiredRef = useRef(false);   // 'deviceorientationabsolute' yoki e.absolute=true bo'lganmi
  const headingInitedRef = useRef(false);   // birinchi o'qish low-pass'siz bootstrap
  const lastCompassAtRef = useRef(0);       // GPS-bearing fallback uchun

  const propSmootherRef = useRef(new PositionSmoother());
  const internalWatcherRef = useRef<GpsWatcher | null>(null);
  const spokenManeuversRef = useRef<Set<string>>(new Set());

  // Dynamic feature refs
  const reroutingRef = useRef(false);
  const lastRerouteAtRef = useRef(0);
  const onlineTransitionRef = useRef<boolean | null>(null);
  const trafficIntervalRef = useRef<number | null>(null);

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
  const [drivingMode, setDrivingMode] = useState(false);
  // iOS 13+ uchun DeviceOrientationEvent.requestPermission() shart.
  // Holatlar:
  //   'checking'    — sahifa yangi yuklandi
  //   'prompt'      — iOS: user-gesture'ni kutmoqdamiz (UI button ko'rsatamiz)
  //   'granted'     — ruxsat berildi yoki Android/desktop (avtomatik attach)
  //   'denied'      — rad etilgan / "keyinroq" tanlandi → GPS-bearing fallback
  //   'unsupported' — DeviceOrientationEvent yo'q
  const [compassPermState, setCompassPermState] = useState<
    'checking' | 'prompt' | 'granted' | 'denied' | 'unsupported'
  >('checking');
  const pipContentRef = useRef<HTMLDivElement | null>(null);

  // Smoothed courier — DEVICE GPS birlamchi (offline ham ishlaydi, real-vaqt,
  // network lag yo'q). courierProp (server socket) faqat device GPS lock
  // bo'lmaguncha fallback sifatida ishlatiladi. Aks holda xarita focus'i
  // server'ning eskirgan/sakraydigan qiymatiga tortilardi (focus bug).
  const smoothedCourier = useMemo<LatLng | null>(() => {
    if (internalCourier) {
      return propSmootherRef.current.smooth(internalCourier.lat, internalCourier.lng, 10);
    }
    if (courierProp) {
      return propSmootherRef.current.smooth(courierProp.lat, courierProp.lng, 10);
    }
    return null;
  }, [internalCourier?.lat, internalCourier?.lng, courierProp?.lat, courierProp?.lng]);

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

  // Polyline rendering — HD sharp, anti-aliased, coord-safe
  const renderPolylines = useCallback((segments: RouteSegment[]) => {
    const map = mapRef.current;
    const ymaps = ymapsRef.current;
    if (!map || !ymaps) return;

    // Eski polylinelarni o'chir
    polylineGroupRef.current.forEach((p) => {
      try { map.geoObjects.remove(p); } catch {/* */}
    });
    polylineGroupRef.current = [];

    segments.forEach((seg) => {
      if (!seg.coords || seg.coords.length < 2) return;

      // SANITY CHECK: bizning ichki format [lng, lat].
      // Yandex Polyline esa [lat, lng] kutadi.
      // Auto-detect: agar birinchi value > 50 (Toshkent uchun: lng~69, lat~41),
      // bu LNG ekanligi aniq → [lng, lat] → swap qilamiz Yandex uchun.
      const yandexCoords: number[][] = seg.coords.map(([a, b]) => {
        // a = stored as lng, b = stored as lat (bizning konventsiya)
        // Yandex needs [lat, lng]
        return [b, a];
      });

      // Validate that all coords are in plausible WGS84 range
      const valid = yandexCoords.every(
        ([lat, lng]) =>
          typeof lat === 'number' &&
          typeof lng === 'number' &&
          lat >= -90 && lat <= 90 &&
          lng >= -180 && lng <= 180,
      );
      if (!valid) return;

      const color = trafficColor(seg.traffic);

      // Yandex uslubi (C3-7): to'q "casing" (kontrast) + ustida QALIN trafik-rangli
      // asosiy chiziq. Har segment o'z trafik rangiga ega → yashil→sariq→qizil gradient.
      const casing = new ymaps.Polyline(yandexCoords, {}, {
        strokeColor: '#13233A',
        strokeWidth: 12,
        strokeOpacity: 0.9,
        strokeStyle: 'solid',
        zIndex: 400,
        antialiasing: true,
      } as Record<string, unknown>);
      map.geoObjects.add(casing);
      polylineGroupRef.current.push(casing);

      const main = new ymaps.Polyline(yandexCoords, {}, {
        strokeColor: color,
        strokeWidth: 8,
        strokeOpacity: 1,
        strokeStyle: 'solid',
        zIndex: 401,
        antialiasing: true,
      } as Record<string, unknown>);
      map.geoObjects.add(main);
      polylineGroupRef.current.push(main);
    });
  }, []);

  // Fallback "navigatsiya chizig'i" — haqiqiy routed polyline hali yo'q bo'lsa
  // (route yuklanmoqda yoki router API ishlamadi), kuryerdan maqsadga to'g'ri
  // (dashed) chiziq chizamiz — kuryer DOIM yo'nalish chizig'ini ko'radi.
  const clearFallbackLine = useCallback(() => {
    const map = mapRef.current;
    if (map && fallbackLineRef.current) {
      try { map.geoObjects.remove(fallbackLineRef.current); } catch {/* */}
    }
    fallbackLineRef.current = null;
  }, []);

  const renderFallbackLine = useCallback((from: LatLng, to: LatLng) => {
    const map = mapRef.current;
    const ymaps = ymapsRef.current;
    if (!map || !ymaps) return;
    clearFallbackLine();
    const line = new ymaps.Polyline(
      [
        [from.lat, from.lng],
        [to.lat, to.lng],
      ],
      {},
      {
        strokeColor: '#2563eb',
        strokeWidth: 5,
        strokeOpacity: 0.85,
        strokeStyle: 'dash',
        zIndex: 390,
        antialiasing: true,
      } as Record<string, unknown>,
    );
    map.geoObjects.add(line);
    fallbackLineRef.current = line;
  }, [clearFallbackLine]);

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

  // COURSE-UP (CSS): xarita konteynerini heading bo'yicha aylantiramiz + tilt.
  // Strelka (iconRotateAngle=heading) konteyner rotateZ(-heading) bilan birga
  // net 0 → oldinga qaragan; xarita esa yo'nalish bo'yicha aylanadi (real nav).
  // Hyper-zoom (manzilga yaqin) — top-down, tilt/aylanish yo'q.
  const applyMapTransform = useCallback((heading: number) => {
    const base = containerRef.current;
    if (!base) return;
    if (hyperZoomActiveRef.current) {
      base.style.transform = 'rotateX(0deg)';
      return;
    }
    const norm = ((heading % 360) + 360) % 360;
    base.style.transform = `rotateX(${NAV_TILT_DEG}deg) rotateZ(${(ROTATE_SIGN * norm).toFixed(1)}deg)`;
  }, []);

  // Oq manyovr (burilish) strelkalari ROUTE USTIDA (C3-7 — Yandex uslubi).
  // Har manyovr koordinatasiga oq chevron + to'q outline; yo'nalish = route
  // bo'ylab oldinga (keyingi manyovr/route oxiriga bearing). Geografik burchak
  // qo'yiladi → course-up konteyner rotatsiyasi uni yo'lga moslab aylantiradi.
  const renderManeuverArrows = useCallback(
    (maneuvers: RouteManeuver[], snappedEnd: [number, number]) => {
      const map = mapRef.current;
      const ymaps = ymapsRef.current;
      if (!map || !ymaps) return;
      // Eskilarini tozalaymiz
      for (const a of maneuverArrowsRef.current) {
        try { map.geoObjects.remove(a); } catch {/* */}
      }
      maneuverArrowsRef.current = [];
      if (!maneuvers || maneuvers.length === 0) return;

      const ArrowLayout = ymaps.templateLayoutFactory!.createClass(
        '<div class="nav-maneuver-arrow" style="transform: rotate({{ properties.iconRotateAngle }}deg);">' +
          '<svg viewBox="0 0 28 28" width="26" height="26">' +
          '<path d="M14 4 L23 22 L14 17 L5 22 Z" fill="#FFFFFF" stroke="#13233A" stroke-width="2.4" stroke-linejoin="round"/>' +
          '</svg></div>',
      );

      for (let i = 0; i < maneuvers.length; i++) {
        const m = maneuvers[i];
        if (!m.coords) continue;
        const from = { lat: m.coords[1], lng: m.coords[0] };
        const nextCoord = maneuvers[i + 1]?.coords ?? snappedEnd;
        const to = { lat: nextCoord[1], lng: nextCoord[0] };
        const bearing = gpsBearing(from, to);
        const arrow = new ymaps.Placemark([from.lat, from.lng], { iconRotateAngle: bearing }, {
          iconLayout: ArrowLayout as unknown as string,
          iconShape: { type: 'Circle', coordinates: [0, 0], radius: 13 },
          zIndex: 410, cursor: 'arrow',
        });
        map.geoObjects.add(arrow);
        maneuverArrowsRef.current.push(arrow);
      }
    },
    [],
  );

  const refreshRoute = useCallback(async (from: LatLng, to: LatLng) => {
    const ymaps = ymapsRef.current;
    if (!ymaps) return;
    const result = await fetchRoute(from, to, vehicleMode, ymaps);
    if (!result || result.segments.length === 0) {
      // Router ishlamadi — kamida to'g'ri yo'nalish chizig'ini ko'rsatamiz
      renderFallbackLine(from, to);
      return;
    }
    clearFallbackLine();
    setRoute(result);
    renderPolylines(result.segments);
    renderManeuverArrows(result.maneuvers, result.snappedEnd);
    renderSnapDot(result.snappedStart);
  }, [vehicleMode, renderPolylines, renderManeuverArrows, renderSnapDot, renderFallbackLine, clearFallbackLine]);

  // Navigatsiya chizig'i DOIM ko'rinsin: haqiqiy route yo'q bo'lsa (yuklanmoqda/
  // xato) kuryerdan maqsadga dashed chiziq; route kelganda olib tashlanadi.
  useEffect(() => {
    if (!mapReady || !smoothedCourier) return;
    if (route && route.segments.length > 0) {
      clearFallbackLine();
      return;
    }
    renderFallbackLine(smoothedCourier, routeTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, smoothedCourier?.lat, smoothedCourier?.lng, routeTo.lat, routeTo.lng, mapReady]);

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
          zoom: CHASE_ZOOM_LEVEL,
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
            // Auto-focus: kuryerga qaytib markazlash + chase-cam yaqin zoom
            if (coords) void m.panTo(coords, { flying: true, duration: PAN_DURATION_MS });
            if (!hyperZoomActiveRef.current) {
              try {
                if (m.getZoom?.() !== CHASE_ZOOM_LEVEL) void m.setZoom(CHASE_ZOOM_LEVEL, { duration: PAN_DURATION_MS });
              } catch {/* */}
            }
          }, AUTOFOCUS_MS);
        };
        map.events.add(['actionbegin', 'wheel'], onInteract);

        // Real Yandex traffic — ko'chalar svetafor/probka rangida (Navigator hissi).
        // package.full traffic provider'ni beradi; xato bo'lsa jimgina o'tkazib yuboramiz.
        try {
          const TrafficProvider = (ymaps as unknown as {
            traffic?: { provider?: { Actual?: new (p: object, o: object) => { setMap: (m: unknown) => void } } };
          }).traffic?.provider?.Actual;
          if (TrafficProvider) {
            const tp = new TrafficProvider({}, { infoLayerShown: true });
            tp.setMap(map);
            trafficProviderRef.current = tp;
          }
        } catch {/* traffic ixtiyoriy — xaritani buzmasin */}

        // Konteyner kech o'lchamlangan bo'lsa (0×0 → qora plitkalar) — majburan moslash.
        try {
          (map as YmapInstance & { container?: { fitToViewport?: () => void } }).container?.fitToViewport?.();
        } catch {/* */}

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
      try { trafficProviderRef.current?.setMap(null); } catch {/* */}
      trafficProviderRef.current = null;
      try { mapRef.current?.destroy(); } catch {/* */}
      mapRef.current = null;
      ymapsRef.current = null;
      courierMarkerRef.current = null;
      polylineGroupRef.current = [];
      fallbackLineRef.current = null;
      snapDotRef.current = null;
      maneuverArrowsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Internal GPS watcher — DOIM ishlaydi (courierProp bo'lsa ham).
  // Device GPS local chip orqali — offline, network lag 0, server eskirgan
  // ma'lumotini hech qachon kutmaymiz. onGpsTick orqali parent'ga emit
  // qilamiz (server ham xabardor bo'lsin).
  useEffect(() => {
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
  }, [onGpsTick]);

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

  // ── INITIAL route fetch — courier birinchi marta paydo bo'lganda BIR MARTA ──
  // CRITICAL: Avval smoothedCourier'ning HAR o'zgarishida refresh qilardik —
  // bu HTTP spam'ga sabab bo'lib map'ni muzlatardi. Endi faqat:
  //  • Birinchi courier paydo bo'lganda (initial fetch)
  //  • routeTo o'zgargancha (bosqich advance — pickup → destination)
  //  • Deviation > 50m (alohida effect)
  //  • Periodic traffic check (alohida effect, har 2 daq)
  const initialRouteFetchedRef = useRef(false);
  useEffect(() => {
    if (!mapReady || !smoothedCourier) return;
    if (initialRouteFetchedRef.current) return;
    initialRouteFetchedRef.current = true;
    void refreshRoute(smoothedCourier, routeTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, smoothedCourier != null]);

  // ── routeTo o'zgarganda yangi route (bosqich advance bo'lganda) ──────
  const lastRouteToRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!mapReady || !smoothedCourier) return;
    if (!initialRouteFetchedRef.current) return;
    const prev = lastRouteToRef.current;
    if (prev && prev.lat === routeTo.lat && prev.lng === routeTo.lng) return;
    lastRouteToRef.current = { lat: routeTo.lat, lng: routeTo.lng };
    void refreshRoute(smoothedCourier, routeTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeTo.lat, routeTo.lng, mapReady]);

  // ── Leg almashuvini ovozli e'lon ("buyurtmani oldingiz → mijozga") ──────
  // routeTo destination'ga teng bo'lsa — yetkazish legi; pickup bo'lsa — restoran legi.
  // Birinchi renderda jim (yangi mount / yarim yo'lda resume noto'g'ri gapirmasin).
  const announcedLegRef = useRef<'pickup' | 'destination' | null>(null);
  useEffect(() => {
    if (!mapReady) return;
    const onDestLeg =
      Math.abs(routeTo.lat - destination.lat) < 1e-7 && Math.abs(routeTo.lng - destination.lng) < 1e-7;
    const leg = onDestLeg ? 'destination' : 'pickup';
    const prev = announcedLegRef.current;
    if (prev === leg) return;
    announcedLegRef.current = leg;
    if (prev === null) return; // birinchi yuklash — e'lon qilmaymiz
    if (leg === 'destination') {
      void speak('Buyurtmani oldingiz, endi mijoz manziliga boring', { key: 'leg_dest' });
    } else {
      void speak("Restoranga yo'l oldingiz", { key: 'leg_pickup' });
    }
  }, [routeTo.lat, routeTo.lng, destination.lat, destination.lng, mapReady]);

  // Courier marker + autofocus + HYPER-ZOOM
  useEffect(() => {
    if (!smoothedCourier) return;
    const marker = courierMarkerRef.current;
    const map = mapRef.current;
    if (!marker || !map) return;

    marker.geometry?.setCoordinates?.([smoothedCourier.lat, smoothedCourier.lng]);

    const distToDest = haversineM(smoothedCourier, destination);
    const shouldHyperZoom = distToDest <= HYPER_ZOOM_RADIUS_M;
    if (shouldHyperZoom && !hyperZoomActiveRef.current) {
      hyperZoomActiveRef.current = true;
      try { void map.setZoom(HYPER_ZOOM_LEVEL, { duration: 800 }); } catch {/* */}
      applyMapTransform(headingRef.current); // top-down (tilt/aylanish yo'q)
      void speak('Manzilga yaqin keldingiz, kirish joyini topshiring', {
        key: `hyperzoom_${destination.lat}_${destination.lng}`,
      });
    } else if (!shouldHyperZoom && hyperZoomActiveRef.current) {
      hyperZoomActiveRef.current = false;
      try { void map.setZoom(CHASE_ZOOM_LEVEL, { duration: 600 }); } catch {/* */}
      applyMapTransform(headingRef.current); // course-up + tilt qaytadi
    }

    if (!interactingRef.current) {
      void map.panTo([smoothedCourier.lat, smoothedCourier.lng], {
        flying: true, duration: PAN_DURATION_MS,
      });
    }
  }, [smoothedCourier?.lat, smoothedCourier?.lng, destination.lat, destination.lng, applyMapTransform]);

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

  // ── GPS-bearing FALLBACK ──────────────────────────────────────────────
  // Magnitometr yo'q / ruxsat berilmagan / kalibrlanmagan holatlarda
  // ketma-ket GPS nuqtalardan heading hisoblaymiz. Compass ishlayotgan
  // bo'lsa (3s ichida tick kelgan), bu fallback URINMAYDI.
  const bearingPrevRef = useRef<LatLng | null>(null);
  const bearingPrevTsRef = useRef<number>(0);
  useEffect(() => {
    if (!smoothedCourier) return;
    const now = Date.now();
    const prev = bearingPrevRef.current;
    const prevTs = bearingPrevTsRef.current;

    if (prev && prevTs > 0) {
      const ageMs = now - prevTs;
      const compassFresh = now - lastCompassAtRef.current < 3_000;
      const movedM = haversineM(prev, smoothedCourier);
      const ms = movedM / Math.max(0.001, ageMs / 1000);
      const kmh = ms * 3.6;

      // Harakat aniq (jitter emas) + tezlik o'rtacha bo'lsa
      if (movedM >= 5 && kmh > 5 && kmh < 250 && !hyperZoomActiveRef.current) {
        const gpsB = gpsBearing(prev, smoothedCourier);
        let applied = false;

        if (!compassFresh) {
          // Kompas yo'q/eskirgan — GPS-bearing birlamchi heading manbai
          if (!headingInitedRef.current) {
            headingRef.current = gpsB;
            headingInitedRef.current = true;
          } else {
            const delta = deltaAngle(headingRef.current, gpsB);
            // GPS bearing ko'proq shovqinli — chuqurroq low-pass (0.12)
            headingRef.current = ((headingRef.current + delta * 0.12) + 360) % 360;
          }
          applied = true;
        } else if (kmh > GPS_FUSION_MIN_KMH) {
          // Kompas bor, lekin tez ketyapmiz — kuchli kelishmovchilikda GPS yo'nalishiga
          // yengil tortamiz (magnit shovqin / noto'g'ri mount holatini tuzatadi)
          const disagree = deltaAngle(headingRef.current, gpsB);
          if (Math.abs(disagree) > GPS_FUSION_DISAGREE_DEG) {
            headingRef.current = ((headingRef.current + disagree * GPS_FUSION_PULL) + 360) % 360;
            applied = true;
          }
        }

        if (applied) {
          courierMarkerRef.current?.properties?.set?.('iconRotateAngle', headingRef.current);
          applyMapTransform(headingRef.current);
        }
      }
    }

    bearingPrevRef.current = smoothedCourier;
    bearingPrevTsRef.current = now;
  }, [smoothedCourier?.lat, smoothedCourier?.lng, applyMapTransform]);

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
            void speak(maneuverVoice(bestMan.m, threshold), { key });
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

  // ── FEATURE 1: 50m deviation detector → auto reroute ────────────────
  useEffect(() => {
    if (!route || !smoothedCourier || !mapReady) return;
    if (reroutingRef.current) return;
    const now = Date.now();
    if (now - lastRerouteAtRef.current < REROUTE_COOLDOWN_MS) return;

    const dist = distanceToRoute(smoothedCourier, route.segments);
    if (dist <= DEVIATION_THRESHOLD_M) return;

    reroutingRef.current = true;
    lastRerouteAtRef.current = now;

    void (async () => {
      try {
        const ymaps = ymapsRef.current;
        if (!ymaps) return;
        const fresh = await fetchRoute(smoothedCourier, routeTo, vehicleMode, ymaps);
        if (!fresh) return;
        // Smooth morph — yangi polyline qo'yib eski o'chiriladi
        setRoute(fresh);
        renderPolylines(fresh.segments);
        renderManeuverArrows(fresh.maneuvers, fresh.snappedEnd);
        renderSnapDot(fresh.snappedStart);
        // TTS dedup'larni reset — yangi maneuvers
        spokenManeuversRef.current.clear();
        void speak("Yo'nalish qayta tuzildi", { key: 'reroute' });
        try {
          const tg = (window as Window & { Telegram?: { WebApp?: { HapticFeedback?: { notificationOccurred?: (s: string) => void } } } })
            .Telegram?.WebApp?.HapticFeedback;
          tg?.notificationOccurred?.('warning');
        } catch {/* */}
      } catch {/* swallow */} finally {
        // Cooldown timer'i yana paydo bo'lguncha
        window.setTimeout(() => { reroutingRef.current = false; }, REROUTE_COOLDOWN_MS);
      }
    })();
  }, [smoothedCourier?.lat, smoothedCourier?.lng, route, vehicleMode, routeTo.lat, routeTo.lng, mapReady, renderPolylines, renderManeuverArrows, renderSnapDot]);

  // ── FEATURE 2: Periodic traffic re-evaluation (har 2 daq) ───────────
  useEffect(() => {
    if (!mapReady) return;
    if (trafficIntervalRef.current != null) {
      window.clearInterval(trafficIntervalRef.current);
    }
    trafficIntervalRef.current = window.setInterval(async () => {
      const ymaps = ymapsRef.current;
      const cur = smoothedCourier;
      const currentRoute = route;
      if (!ymaps || !cur || !currentRoute) return;
      // Reroute hozir ishlayotgan bo'lsa — yana so'rovi yubormaslik
      if (reroutingRef.current) return;
      // Offline — cache yangi qiymat bermaydi
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      try {
        const fresh = await fetchRoute(cur, routeTo, vehicleMode, ymaps);
        if (!fresh) return;
        const savedSec = currentRoute.totalDurationSec - fresh.totalDurationSec;
        if (savedSec >= TRAFFIC_IMPROVEMENT_SEC) {
          setRoute(fresh);
          renderPolylines(fresh.segments);
          renderManeuverArrows(fresh.maneuvers, fresh.snappedEnd);
          renderSnapDot(fresh.snappedStart);
          spokenManeuversRef.current.clear();
          void speak(
            `Trafik tufayli qisqaroq yo'l topildi. ${Math.round(savedSec / 60)} daqiqa tezroq`,
            { key: 'better_route' },
          );
        }
      } catch {/* */}
    }, TRAFFIC_RECHECK_MS);

    return () => {
      if (trafficIntervalRef.current != null) {
        window.clearInterval(trafficIntervalRef.current);
        trafficIntervalRef.current = null;
      }
    };
  }, [mapReady, smoothedCourier?.lat, smoothedCourier?.lng, route?.totalDurationSec, routeTo.lat, routeTo.lng, vehicleMode, renderPolylines, renderManeuverArrows, renderSnapDot]);

  // ── FEATURE 3: Network transition → TTS announce ────────────────────
  useEffect(() => {
    // Birinchi mount'da boshlang'ich qiymatni qayd etamiz, jim
    if (onlineTransitionRef.current === null) {
      onlineTransitionRef.current = isOnline;
      return;
    }
    if (onlineTransitionRef.current && !isOnline) {
      void speak("Internet aloqasi uzildi. Oflayn kesh rejimi yoqildi", { key: 'offline_announce' });
      beep(440, 300);
    } else if (!onlineTransitionRef.current && isOnline) {
      void speak('Internet aloqasi tiklandi', { key: 'online_announce' });
      beep(880, 220);
    }
    onlineTransitionRef.current = isOnline;
  }, [isOnline]);

  // ── FEATURE 4: Safe driving mode (>15 km/h → hide non-critical UI) ──
  useEffect(() => {
    if (currentSpeedKmh == null) return;
    if (!drivingMode && currentSpeedKmh > DRIVING_MODE_ENTER_KMH) {
      setDrivingMode(true);
    } else if (drivingMode && currentSpeedKmh < DRIVING_MODE_EXIT_KMH) {
      setDrivingMode(false);
    }
  }, [currentSpeedKmh, drivingMode]);

  // Compass — magnit shimoldan true heading.
  //
  // 1) Birinchi o'qish low-pass'siz bootstrap (aks holda 0 → real_heading
  //    sekin konvergensiya, marker shimol'da yopishib qoladi)
  // 2) `deviceorientationabsolute` (yoki e.absolute=true) bo'lsa, relativ
  //    `deviceorientation` event'ini e'tiborsiz qoldiramiz (Android jitter)
  // 3) Screen orientation (portret/landshaft) — heading'ga qo'shamiz
  // 4) iOS webkitCompassAccuracy < 0 → kalibrlanmagan, skip
  // 5) Tezlikda GPS-bearing fallback (alohida effect'da)
  const attachCompass = useCallback(() => {
    if (compassListenerCleanupRef.current) return;
    let raf: number | null = null;

    const getScreenAngle = (): number => {
      if (typeof screen !== 'undefined' && screen.orientation?.angle != null) {
        return screen.orientation.angle;
      }
      const legacy = (window as Window & { orientation?: number }).orientation;
      return typeof legacy === 'number' ? legacy : 0;
    };

    const handler = (
      e: DeviceOrientationEvent & {
        webkitCompassHeading?: number;
        webkitCompassAccuracy?: number;
      },
    ) => {
      // Hyper-zoom (top-down) — xarita aylanmasin
      if (hyperZoomActiveRef.current) return;

      const isAbsoluteEvent =
        e.type === 'deviceorientationabsolute' || e.absolute === true;
      if (isAbsoluteEvent) absoluteFiredRef.current = true;

      // Bir marta absolute o'qishni ko'rganmiz — boshqa relativ event'lar (alpha
      // = sahifa yuklanganidan beri burilish) magnit heading EMAS, e'tibor bermaymiz
      if (absoluteFiredRef.current && !isAbsoluteEvent) return;

      let raw: number | null = null;
      // Ekran orientatsiyasi (portret=0, landshaft=90/270). Kompensatsiya
      // MAJBURIY — aks holda telefon yon aylanса heading 90° siljiydi.
      const screenAngle = getScreenAngle();

      // iOS — webkitCompassHeading: true-north'dan clockwise, ENG ANIQ manba.
      // iOS qiymatni EKRAN ramkasiga nisbatan beradi → screenAngle AYIRILADI.
      // (Android alpha'da esa QO'SHILADI — konvensiyalar teskari. Avval ikkala
      //  tarmoqqa ham qo'shilardi → iOS landshaftда/offsetда kompas xato edi: C3-1.)
      if (typeof e.webkitCompassHeading === 'number') {
        // iOS accuracy < 0 → magnitometr kalibrlanmagan
        if (typeof e.webkitCompassAccuracy === 'number' && e.webkitCompassAccuracy < 0) return;
        raw = e.webkitCompassHeading - screenAngle;
      } else if (isAbsoluteEvent && e.alpha != null) {
        // Android Chrome — alpha: 0 = shimol, yuqoridan counter-clockwise.
        // True heading (clockwise from north) = (360 - alpha), so'ng ekran burchagi.
        raw = (360 - e.alpha) + screenAngle;
      } else {
        return;
      }

      // 0..360 normalizatsiya (manfiy qiymatni ham to'g'irlaydi)
      raw = ((raw % 360) + 360) % 360;

      // Birinchi o'qishni TO'G'RIDAN-TO'G'RI yozamiz — low-pass'ga shimol'dan
      // boshlash marker'ni sekin konvergensiya qiladi (eski bug)
      if (!headingInitedRef.current) {
        headingRef.current = raw;
        headingInitedRef.current = true;
      } else {
        const current = headingRef.current;
        const delta = deltaAngle(current, raw);
        // Dead-zone — turganda mikro-jitter marker'ni titratmasin
        if (Math.abs(delta) < COMPASS_DEADZONE_DEG) {
          lastCompassAtRef.current = Date.now();
          return;
        }
        // Adaptiv low-pass — silliqlik bilan tezkorlik balansi
        headingRef.current = ((current + delta * adaptiveHeadingAlpha(delta)) + 360) % 360;
      }

      lastCompassAtRef.current = Date.now();

      if (raf == null) {
        raf = window.requestAnimationFrame(() => {
          raf = null;
          // Course-up: strelka iconRotate(heading) + konteyner rotateZ(-heading)
          // → strelka net oldinga, xarita yo'nalish bo'yicha aylanadi (CSS bilan,
          // chunki Yandex raster native setAzimuth'ni qo'llamaydi).
          courierMarkerRef.current?.properties?.set?.('iconRotateAngle', headingRef.current);
          applyMapTransform(headingRef.current);
        });
      }
    };

    let absoluteAdded = false;
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute' as keyof WindowEventMap, handler as EventListener);
      absoluteAdded = true;
    }
    // Relativ event'ni ham qo'shamiz — iOS faqat shu bilan webkitCompassHeading'ni beradi.
    // Lekin handler ichida absoluteFired bo'lsa, alpha-based relativ o'qishni skip qiladi.
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
  }, [applyMapTransform]);

  // Boshlang'ich aniqlash: iOS 13+ user-gesture so'raydi, qolganlari avtomatik.
  //
  //  MUHIM: iOS Safari'da DeviceOrientationEvent.requestPermission() FAQAT
  //  haqiqiy user click event'i ichida (synchronously) chaqirilishi mumkin.
  //  Eski kod `pointerdown` + async wrapper orqali chaqirardi — iOS uni
  //  gesture'siz chaqirilgan deb hisoblab silently rad etardi.
  //
  //  Endi: state='prompt' bo'lganda <CompassPermissionPrompt> ko'rinadi va
  //  uning Button onClick'i to'g'ridan-to'g'ri requestPermission()'ni
  //  chaqiradi (gesture context saqlanadi).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof DeviceOrientationEvent === 'undefined') {
      setCompassPermState('unsupported');
      return;
    }
    const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof DOE.requestPermission === 'function') {
      // iOS 13+ — UI prompt'ni ko'rsatamiz, foydalanuvchi click qilsa permission so'raymiz
      setCompassPermState('prompt');
      compassRequestedRef.current = false;
    } else {
      // Android / desktop — permission yo'q, darrov attach
      attachCompass();
      compassRequestedRef.current = true;
      setCompassPermState('granted');
    }
  }, [attachCompass]);

  // iOS permission — to'g'ridan-to'g'ri click handler ichida chaqiriladi.
  // ASYNC bo'lsa-da, DOE.requestPermission() chaqiruvi SYNCHRON ravishda
  // boshlanadi (Promise qaytguncha) — iOS shu paytda gesture'ni ko'radi.
  const requestCompassPermission = useCallback(async () => {
    const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof DOE?.requestPermission !== 'function') {
      attachCompass();
      setCompassPermState('granted');
      return;
    }
    try {
      const result = await DOE.requestPermission();
      if (result === 'granted') {
        attachCompass();
        compassRequestedRef.current = true;
        setCompassPermState('granted');
      } else {
        setCompassPermState('denied');
      }
    } catch {
      // iOS gesture'siz chaqirsa bu yerga tushadi — yana urinish mumkin
      setCompassPermState('denied');
    }
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
  const maneuverText = nextManeuver
    ? (nextManeuver.instruction?.trim() || maneuverLabel(nextManeuver.type))
    : null;
  const isOfflineRoute = route?.source === 'cache';

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-[#0a0a0c] ${!isOnline ? 'offline-crimson-border' : ''}`}
      data-no-ptr="true"
    >
      <div className="map-3d-wrap absolute inset-0">
        <div ref={containerRef} className="map-base map-night-filter" />
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

        <div
          className={`flex flex-col items-end gap-1.5 transition-opacity duration-300 ${
            drivingMode ? 'pointer-events-none opacity-25' : 'opacity-100'
          }`}
        >
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/95 text-slate-900 shadow-2xl shadow-black/60 active:scale-95"
              aria-label="Yopish"
              disabled={drivingMode}
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
            disabled={drivingMode}
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
              disabled={drivingMode}
            >
              <PictureInPicture2 size={15} />
            </button>
          )}
        </div>
      </div>

      {!isOnline && (
        <div
          className="pointer-events-auto absolute left-1/2 z-20 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 shadow-2xl offline-pulse"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 62px)' }}
        >
          <WifiOff size={12} className="text-white" />
          <span className="text-[11px] font-black uppercase tracking-wider text-white">
            Oflayn — keshlangan marshrut
          </span>
        </div>
      )}

      {/* Rerouting indikator */}
      {reroutingRef.current && (
        <div
          className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-amber-500/95 px-3 py-1.5 shadow-2xl"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 62px)' }}
        >
          <Loader2 size={12} className="animate-spin text-white" />
          <span className="text-[11px] font-black uppercase tracking-wider text-white">
            Yo&apos;nalish qayta tuzilmoqda...
          </span>
        </div>
      )}

      {/* Driving mode badge */}
      {drivingMode && (
        <div
          className="pointer-events-none absolute right-2 z-20 flex items-center gap-1 rounded-full bg-emerald-500/95 px-2 py-1 shadow-lg"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 62px)' }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider text-white">
            Haydash rejimi
          </span>
        </div>
      )}

      {nextManeuver && ManeuverIcon && (
        <div
          ref={pipContentRef}
          className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 90px)' }}
        >
          <div className="flex max-w-[88vw] items-center gap-3 rounded-3xl bg-white/95 px-4 py-3 shadow-2xl shadow-black/70 backdrop-blur">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
              <ManeuverIcon size={30} strokeWidth={3} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Keyingi</p>
              <p className="line-clamp-2 text-lg font-black leading-tight text-slate-900">{maneuverText}</p>
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

      {compassPermState === 'prompt' && mapReady && (
        <CompassPermissionPrompt onAllow={requestCompassPermission} />
      )}

      <style jsx global>{`
        .map-3d-wrap { perspective: 1200px; perspective-origin: 50% 56%; overflow: hidden; }
        /* Course-up: konteyner viewport'dan KATTA (170%, markazda) — JS rotateZ bilan
           aylanganда burchaklar bo'shamasin. JS inline transform'i bu default'ni
           almashtiradi (rotateX tilt + rotateZ -heading). */
        .map-base {
          position: absolute;
          width: 170%; height: 170%; left: -35%; top: -35%;
          transform: rotateX(40deg);
          transform-origin: 50% 50%;
          transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
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
        .nav-maneuver-arrow {
          width: 26px; height: 26px;
          transform-origin: 50% 50%;
          margin: -13px 0 0 -13px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
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

        /* Crimson border — internet aloqasi uzilganda */
        @keyframes crimsonBorderPulse {
          0%, 100% { box-shadow: inset 0 0 0 4px #dc2626, inset 0 0 24px rgba(220, 38, 38, 0.35); }
          50%      { box-shadow: inset 0 0 0 4px rgba(220, 38, 38, 0.3), inset 0 0 8px rgba(220, 38, 38, 0.15); }
        }
        .offline-crimson-border { animation: crimsonBorderPulse 1.1s ease-in-out infinite; }

        @keyframes offlineChipPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.55); }
          50%      { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
        }
        .offline-pulse { animation: offlineChipPulse 1.1s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

/**
 * Kompos ruxsati uchun KICHIK pastdagi tugma.
 *
 * iOS Safari'da DeviceOrientationEvent.requestPermission() FAQAT real
 * click ichidan ishlaydi — tugmaning onClick'i to'g'ridan-to'g'ri
 * permission'ni chaqiradi. Bottom HUD panel'i ustida, xaritani
 * yopib qoymaydi. Grant'dan keyin avtomatik yo'qoladi.
 */
function CompassPermissionPrompt({ onAllow }: { onAllow: () => void }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-30 mx-auto flex w-full max-w-[420px] justify-center px-4"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 130px)' }}
    >
      <button
        type="button"
        onClick={onAllow}
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-amber-500/95 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-white shadow-2xl shadow-amber-900/40 backdrop-blur active:scale-95"
      >
        <Compass size={14} strokeWidth={2.8} />
        Kompos · Ruxsat berish
      </button>
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
