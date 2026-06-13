'use client';

/**
 * DeliveryNavigator (PRO version) — premium kuryer navigatsiya.
 *
 * KIYDIRILGAN XUSUSIYATLAR:
 *
 *  1. DARK PREMIUM RENDER
 *     • Yandex Maps v2.1 + CSS filter (invert+hue-rotate) → dark "night-mode"
 *     • POI/transport/copyright butunlay yashirilgan
 *     • CSS perspective transform → 3D tilt his
 *     • Vignette gradient — fokus markerda
 *
 *  2. NATIVE HTTP ROUTER (server proxy /api/maps/route)
 *     • Server-side YANDEX_ROUTER_API_KEY ishlatadi
 *     • Trafik darajalari (free/medium/heavy) + maneuvers
 *     • Fallback: multiRouter (JS API) — birinchi marta ishlamasa
 *
 *  3. CUSTOM ANTI-ALIASED POLYLINES
 *     • multiRouter standart chizig'i o'chirilgan
 *     • Har segment trafic rangda (emerald→amber→orange→red)
 *     • HD strokeWidth: 7px + outline 9px (oq border = anti-alias hissi)
 *
 *  4. SILENT COMPASS PERMISSION
 *     • Birinchi xaritaga teginishda iOS requestPermission silently
 *     • Foydalanuvchi banner KO'RMAYDI
 *
 *  5. MAP ROTATION WITH COMPASS
 *     • Telefon kompasi → setAzimuth → xarita harakat yo'nalishida
 *     • Low-pass filter (0.22) — jitter yo'q
 *     • Marker har doim ekranda "yuqoriga" qaraydi
 *
 *  6. 3-SOND AUTOFOCUS
 *     • Sudrash → 3s idle → panTo(courierCoords)
 *
 *  7. SNAP-TO-ROAD
 *     • HTTP API / multiRouter birinchi koordinatasidan boshlanadi
 *     • Bino ichidan marshrut chiqmaydi
 *
 *  8. TURN ARROW OVERLAY
 *     • Yaqin maneuver detektsiyasi (50m ichida)
 *     • Top-center'da SVG arrow (chap/o'ng/aylanma)
 *
 *  9. HUD
 *     • Status (stage), masofa, ETA, qolgan vaqt
 *     • Trafik progress meter (gradient)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  Loader2,
  RotateCcw,
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

export type VehicleMode = 'auto' | 'bicycle' | 'pedestrian';

interface DeliveryNavigatorProps {
  pickup: LatLng;
  destination: LatLng;
  courier?: LatLng | null;
  routeTo: LatLng;
  vehicleMode?: VehicleMode;
  onClose?: () => void;
  orderNumber?: string;
  /** Hozirgi delivery bosqichi (HUD'da matn) */
  stageLabel?: string;
}

const AUTOFOCUS_MS = 3_000;
const PAN_DURATION_MS = 650;
const HEADING_LOW_PASS = 0.22;
const NEAR_MANEUVER_METERS = 60;

function deltaAngle(a: number, b: number): number {
  return ((b - a + 540) % 360) - 180;
}
function haversineM(a: LatLng, b: LatLng): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
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

/** Maneuver type'dan ikonkani aniqlash. */
function maneuverIcon(type: string): typeof ArrowUp {
  const t = type.toLowerCase();
  if (t.includes('left')) return ArrowLeft;
  if (t.includes('right')) return ArrowRight;
  if (t.includes('roundabout') || t.includes('u-turn') || t.includes('uturn')) return RotateCcw;
  return ArrowUp;
}
function maneuverLabel(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('sharp-left') || t.includes('sharp_left')) return "Keskin chapga";
  if (t.includes('sharp-right') || t.includes('sharp_right')) return "Keskin o'ngga";
  if (t.includes('slight-left') || t.includes('slight_left')) return 'Engil chapga';
  if (t.includes('slight-right') || t.includes('slight_right')) return "Engil o'ngga";
  if (t.includes('left')) return 'Chapga';
  if (t.includes('right')) return "O'ngga";
  if (t.includes('roundabout')) return 'Aylanma';
  if (t.includes('u-turn') || t.includes('uturn')) return 'Orqaga';
  return "To'g'ri";
}

export function DeliveryNavigator({
  pickup,
  destination,
  courier,
  routeTo,
  vehicleMode = 'auto',
  onClose,
  orderNumber,
  stageLabel,
}: DeliveryNavigatorProps) {
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

  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [nextManeuver, setNextManeuver] = useState<RouteManeuver | null>(null);
  const [maneuverDistance, setManeuverDistance] = useState<number | null>(null);

  // ── Custom anti-aliased polyline rendering ──────────────────────────
  const renderPolylines = useCallback(
    (segments: RouteSegment[]) => {
      const map = mapRef.current;
      const ymaps = ymapsRef.current;
      if (!map || !ymaps) return;

      // Eski polyline'larni o'chir
      polylineGroupRef.current.forEach((p) => {
        try { map.geoObjects.remove(p); } catch {/* */}
      });
      polylineGroupRef.current = [];

      segments.forEach((seg) => {
        if (seg.coords.length < 2) return;
        // ymaps polyline'da [lat,lng] kerak
        const latLngCoords = seg.coords.map(([lng, lat]) => [lat, lng] as number[]);
        const color = trafficColor(seg.traffic);

        // Outline (oq border — HD anti-aliasing hissi)
        const outline = new ymaps.Polyline(
          latLngCoords as number[][],
          {},
          {
            strokeColor: '#ffffff',
            strokeWidth: 9,
            strokeOpacity: 0.7,
            strokeStyle: 'solid',
            zIndex: 400,
          },
        );
        map.geoObjects.add(outline);
        polylineGroupRef.current.push(outline);

        // Asosiy chiziq
        const mainLine = new ymaps.Polyline(
          latLngCoords as number[][],
          {},
          {
            strokeColor: color,
            strokeWidth: 6.5,
            strokeOpacity: 1,
            strokeStyle: 'solid',
            zIndex: 401,
          },
        );
        map.geoObjects.add(mainLine);
        polylineGroupRef.current.push(mainLine);
      });
    },
    [],
  );

  // ── Snap-to-road dot ────────────────────────────────────────────────
  const renderSnapDot = useCallback((coords: [number, number]) => {
    const map = mapRef.current;
    const ymaps = ymapsRef.current;
    if (!map || !ymaps) return;
    try {
      if (snapDotRef.current) map.geoObjects.remove(snapDotRef.current);
    } catch {/* */}

    const DotLayout = ymaps.templateLayoutFactory!.createClass(
      '<div class="nav-snap-dot"></div>',
    );
    const dot = new ymaps.Placemark(
      [coords[1], coords[0]], // [lng,lat] → [lat,lng]
      {},
      {
        iconLayout: DotLayout as unknown as string,
        iconShape: { type: 'Circle', coordinates: [0, 0], radius: 9 },
        zIndex: 500,
        cursor: 'arrow',
      },
    );
    map.geoObjects.add(dot);
    snapDotRef.current = dot;
  }, []);

  // ── Fetch route (HTTP yoki multiRouter) ─────────────────────────────
  const refreshRoute = useCallback(
    async (from: LatLng, to: LatLng) => {
      const ymaps = ymapsRef.current;
      if (!ymaps) return;
      const result = await fetchRoute(from, to, vehicleMode, ymaps);
      if (!result) return;
      setRoute(result);
      renderPolylines(result.segments);
      renderSnapDot(result.snappedStart);
    },
    [vehicleMode, renderPolylines, renderSnapDot],
  );

  // ── Map init ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    loadYandexMaps()
      .then((ymaps) => {
        if (cancelled || !containerRef.current) return;
        ymapsRef.current = ymaps;

        const center = courier ?? pickup;
        const map = new ymaps.Map(
          containerRef.current,
          {
            center: [center.lat, center.lng],
            zoom: 17,
            controls: [],
            type: 'yandex#map',
          },
          {
            suppressMapOpenBlock: true,
            yandexMapDisablePoiInteractivity: true,
            // Defaultlarni yashirish
            copyrightUaVisible: false,
            copyrightLogoVisible: false,
            copyrightProvidersVisible: false,
            minZoom: 4,
            maxZoom: 21,
            avoidFractionalZoom: false,
          } as Record<string, unknown>,
        );
        mapRef.current = map;

        // ── Courier rotatable arrow marker ──────────────────────────────
        const CourierArrowLayout = ymaps.templateLayoutFactory!.createClass(
          [
            '<div class="navigator-arrow-wrap" style="transform: rotate({{ properties.iconRotateAngle }}deg);">',
            '<svg viewBox="0 0 48 60" width="48" height="60" xmlns="http://www.w3.org/2000/svg">',
            '<defs>',
            '<linearGradient id="navArrG" x1="0" y1="0" x2="0" y2="1">',
            '<stop offset="0%" stop-color="#fb923c"/>',
            '<stop offset="100%" stop-color="#9a3412"/>',
            '</linearGradient>',
            '<filter id="navArrS" x="-50%" y="-50%" width="200%" height="200%">',
            '<feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.7)"/>',
            '</filter>',
            '</defs>',
            '<circle cx="24" cy="46" r="9" fill="rgba(251,146,60,0.25)"/>',
            '<path d="M 24 3 L 44 52 L 24 40 L 4 52 Z" fill="url(#navArrG)" stroke="#fff" stroke-width="3" stroke-linejoin="round" filter="url(#navArrS)"/>',
            '<circle cx="24" cy="28" r="4" fill="#fff"/>',
            '</svg>',
            '</div>',
          ].join(''),
        );

        const courierMarker = new ymaps.Placemark(
          [(courier ?? pickup).lat, (courier ?? pickup).lng],
          { iconRotateAngle: 0 },
          {
            iconLayout: CourierArrowLayout as unknown as string,
            iconShape: { type: 'Rectangle', coordinates: [[-24, -30], [24, 30]] },
            zIndex: 1000,
            cursor: 'arrow',
          },
        );
        map.geoObjects.add(courierMarker);
        courierMarkerRef.current = courierMarker;

        // ── Pickup pin (amber) ──────────────────────────────────────────
        const PickupLayout = ymaps.templateLayoutFactory!.createClass(
          '<div class="nav-pin nav-pin-pickup">' +
            '<svg width="38" height="46" viewBox="0 0 36 44"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z" fill="#f59e0b" stroke="#fff" stroke-width="3"/><circle cx="18" cy="18" r="6" fill="#fff"/></svg>' +
            '</div>',
        );
        map.geoObjects.add(
          new ymaps.Placemark(
            [pickup.lat, pickup.lng],
            { hintContent: 'Restoran' },
            {
              iconLayout: PickupLayout as unknown as string,
              iconShape: { type: 'Rectangle', coordinates: [[-19, -46], [19, 0]] },
              zIndex: 700,
            },
          ),
        );

        // ── Destination pin (ember) ─────────────────────────────────────
        const DestLayout = ymaps.templateLayoutFactory!.createClass(
          '<div class="nav-pin nav-pin-dest">' +
            '<svg width="38" height="46" viewBox="0 0 36 44"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z" fill="#c62020" stroke="#fff" stroke-width="3"/><path d="M12 19v-3l6-5 6 5v3h-2v6h-3v-4h-2v4h-3v-6z" fill="#fff"/></svg>' +
            '</div>',
        );
        map.geoObjects.add(
          new ymaps.Placemark(
            [destination.lat, destination.lng],
            { hintContent: 'Mijoz' },
            {
              iconLayout: DestLayout as unknown as string,
              iconShape: { type: 'Rectangle', coordinates: [[-19, -46], [19, 0]] },
              zIndex: 700,
            },
          ),
        );

        // ── Map interaction (autofocus pause) ───────────────────────────
        const onInteract = () => {
          interactingRef.current = true;
          if (autofocusTimerRef.current != null) window.clearTimeout(autofocusTimerRef.current);
          autofocusTimerRef.current = window.setTimeout(() => {
            interactingRef.current = false;
            const marker = courierMarkerRef.current;
            const m = mapRef.current;
            if (!marker || !m) return;
            const coords = marker.geometry?.getCoordinates?.();
            if (coords) {
              void m.panTo(coords, { flying: true, duration: PAN_DURATION_MS });
            }
          }, AUTOFOCUS_MS);
        };
        map.events.add(['actionbegin', 'wheel'], onInteract);

        setMapReady(true);

        // Init route
        const from = courier ?? pickup;
        void refreshRoute(from, routeTo);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Xaritani yuklab bo'lmadi");
        }
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

  // ── Refresh route when coords change ────────────────────────────────
  useEffect(() => {
    if (!mapReady) return;
    const from = courier ?? pickup;
    void refreshRoute(from, routeTo);
  }, [mapReady, courier?.lat, courier?.lng, routeTo.lat, routeTo.lng, pickup.lat, pickup.lng, refreshRoute]);

  // ── Courier position updates ────────────────────────────────────────
  useEffect(() => {
    if (!courier) return;
    const marker = courierMarkerRef.current;
    const map = mapRef.current;
    if (!marker || !map) return;
    marker.geometry?.setCoordinates?.([courier.lat, courier.lng]);
    if (!interactingRef.current) {
      void map.panTo([courier.lat, courier.lng], { flying: true, duration: PAN_DURATION_MS });
    }
  }, [courier?.lat, courier?.lng]);

  // ── Detect next maneuver ────────────────────────────────────────────
  useEffect(() => {
    if (!route || !courier) {
      setNextManeuver(null);
      setManeuverDistance(null);
      return;
    }
    let bestManeuver: RouteManeuver | null = null;
    let bestDist = Infinity;
    for (const m of route.maneuvers) {
      const d = haversineM(courier, { lat: m.coords[1], lng: m.coords[0] });
      if (d < bestDist && d <= NEAR_MANEUVER_METERS) {
        bestDist = d;
        bestManeuver = m;
      }
    }
    setNextManeuver(bestManeuver);
    setManeuverDistance(bestManeuver ? Math.round(bestDist) : null);
  }, [route, courier?.lat, courier?.lng]);

  // ── Silent compass permission + attach listeners ────────────────────
  const attachCompass = useCallback(() => {
    if (compassListenerCleanupRef.current) return;
    let raf: number | null = null;

    const handler = (e: DeviceOrientationEvent) => {
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
          // Map azimuth — kuryer harakat yo'nalishi har doim "yuqoriga"
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

  // Silent permission on first user touch (iOS yashirin oqim)
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
        } catch {/* foydalanuvchi bekor qildi — jim */}
      } else {
        attachCompass();
      }
    };

    // Birinchi pointerdown / touchstart hodisasida silently chaqirish
    const onceHandler = () => {
      void silentRequest();
      window.removeEventListener('pointerdown', onceHandler);
      window.removeEventListener('touchstart', onceHandler);
    };
    window.addEventListener('pointerdown', onceHandler, { once: true, passive: true });
    window.addEventListener('touchstart', onceHandler, { once: true, passive: true });

    // Non-iOS: darhol attach (permission talab qilmaydi)
    if (typeof DOE?.requestPermission !== 'function') {
      attachCompass();
      compassRequestedRef.current = true;
    }

    return () => {
      window.removeEventListener('pointerdown', onceHandler);
      window.removeEventListener('touchstart', onceHandler);
    };
  }, [attachCompass]);

  // ── Render ──────────────────────────────────────────────────────────
  const ManeuverIcon = nextManeuver ? maneuverIcon(nextManeuver.type) : null;
  const maneuverText = nextManeuver ? maneuverLabel(nextManeuver.type) : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0a0c]" data-no-ptr="true">
      {/* Map container — CSS filter bilan dark + perspective 3D */}
      <div className="map-3d-wrap absolute inset-0">
        <div ref={containerRef} className="map-dark-filter h-full w-full" />
      </div>

      {/* Vignette + horizon fade */}
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
        style={{
          background: 'linear-gradient(to bottom, rgba(10,10,12,0.85), transparent)',
        }}
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

      {/* Top bar */}
      <div
        className="pointer-events-auto absolute inset-x-0 z-20 mx-auto flex w-full max-w-[480px] items-center justify-between gap-3 px-4 pt-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 text-slate-900 shadow-2xl shadow-black/60 active:scale-95"
            aria-label="Yopish"
          >
            <X size={18} />
          </button>
        ) : (
          <div className="w-11" />
        )}

        {orderNumber && (
          <div className="rounded-2xl bg-white/95 px-4 py-2 shadow-2xl shadow-black/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {vehicleMode === 'pedestrian'
                ? 'Piyoda'
                : vehicleMode === 'bicycle'
                  ? 'Skuter'
                  : 'Mashina'}
              {route?.source === 'yandex-http' && <span className="ml-1 text-emerald-500">●</span>}
            </p>
            <p className="text-sm font-black text-slate-900">#{orderNumber}</p>
          </div>
        )}

        <div className="w-11" />
      </div>

      {/* Turn arrow overlay — yaqin maneuver bo'lsa */}
      {nextManeuver && ManeuverIcon && (
        <div
          className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 78px)' }}
        >
          <div className="flex items-center gap-3 rounded-3xl bg-white/95 px-4 py-3 shadow-2xl shadow-black/70 backdrop-blur">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
              <ManeuverIcon size={26} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Keyingi
              </p>
              <p className="text-base font-black leading-tight text-slate-900">{maneuverText}</p>
              {maneuverDistance != null && (
                <p className="text-[11px] font-bold text-[#c62020]">
                  {maneuverDistance < 50 ? 'Hozir' : `${maneuverDistance} m`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HUD bottom panel */}
      {route && mapReady && (
        <NavigatorHUD
          distanceMeters={route.totalDistanceMeters}
          durationSec={route.totalDurationSec}
          stageLabel={stageLabel}
          segments={route.segments}
        />
      )}

      {/* CSS — dark filter, 3D perspective, custom pin/dot styles */}
      <style jsx global>{`
        .map-3d-wrap {
          perspective: 1400px;
          perspective-origin: 50% 65%;
        }
        .map-dark-filter {
          filter: invert(0.92) hue-rotate(190deg) saturate(0.85) brightness(1.05) contrast(1.05);
          transform: rotateX(45deg) translateZ(0);
          transform-origin: 50% 65%;
          transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        /* Yandex copyright/control'larni gizle */
        .map-dark-filter .ymaps-2-1-79-copyright,
        .map-dark-filter ymaps[class*="copyright"],
        .map-dark-filter ymaps[class*="controls__toolbar"] {
          display: none !important;
        }

        .navigator-arrow-wrap {
          width: 48px;
          height: 60px;
          transform-origin: 50% 60%;
          transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }
        .nav-pin {
          width: 38px;
          height: 46px;
          transform: translate(-19px, -46px);
          filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.55));
        }
        .nav-snap-dot {
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: #3b82f6;
          border: 3px solid #fff;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25), 0 4px 12px rgba(0, 0, 0, 0.55);
          transform: translate(-9px, -9px);
        }
      `}</style>
    </div>
  );
}

function NavigatorHUD({
  distanceMeters,
  durationSec,
  stageLabel,
  segments,
}: {
  distanceMeters: number;
  durationSec: number;
  stageLabel?: string;
  segments: RouteSegment[];
}) {
  const eta = formatTime(durationSec);

  // Trafik dinamik gradient — har segment uchun rang chizig'i
  const trafficGradient = (() => {
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
  })();

  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[480px]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Trafik chizig'i — har segment uchun rang */}
      <div className="h-1.5 w-full overflow-hidden" style={{ background: trafficGradient }} />

      {/* HUD content */}
      <div className="bg-[#0f0f12] px-5 py-3.5 text-white shadow-[0_-12px_24px_-4px_rgba(0,0,0,0.6)]">
        {stageLabel && (
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            {stageLabel}
          </p>
        )}
        <div className="flex items-center justify-between">
          {/* Masofa */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/70">
                <path d="M8 3v18M3 8l5-5 5 5M16 21V3M21 16l-5 5-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Masofa</p>
              <p className="text-base font-black tabular-nums leading-tight">
                {formatDist(distanceMeters)}
              </p>
            </div>
          </div>

          {/* ETA */}
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              Yetib boradi
            </p>
            <p className="text-2xl font-black tabular-nums leading-tight">{eta}</p>
          </div>

          {/* Davomiyligi */}
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Vaqt</p>
            <p className="text-base font-black tabular-nums leading-tight">
              {formatDur(durationSec)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
