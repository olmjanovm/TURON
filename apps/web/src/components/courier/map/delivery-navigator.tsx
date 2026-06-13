'use client';

/**
 * DeliveryNavigator — professional Yandex Navigator stiliga taqlid qiluvchi
 * kuryer navigatsiya komponenti.
 *
 * XUSUSIYATLAR:
 *  1. Yandex Maps v2.1 JS API (NEXT_PUBLIC_YANDEX_MAP_API_KEY orqali)
 *  2. multiRouter.MultiRoute — vehicleMode'ga qarab marshrut:
 *     - auto       → mashina (asfaltdan, avoidTrafficJams)
 *     - bicycle    → skuter/velosiped (yo'l ko'chalari)
 *     - pedestrian → piyoda (piyodalar yo'li)
 *  3. Snap-to-road: kuryer bino ichida bo'lsa ham marshrut eng yaqin
 *     ko'chadan boshlanadi, snap nuqtasida kichik ko'k doira
 *  4. DeviceOrientation API — telefon kompasiga qarab orange uchburchak
 *     marker real-time aylanadi (iOS uchun ruxsat so'raydi)
 *  5. 3 soniya autofocus — foydalanuvchi xaritani sursa pauza, 3s'dan keyin
 *     yana kuryer markaziga qaytadi
 *  6. setReferencePoints — yangi GPS koordinata kelganda butun xarita
 *     yangilanmaydi, faqat marshrut chizig'i smooth yangilanadi
 *  7. Pastki HUD — Yandex Navigator stilida: masofa | ETA | qolgan vaqt
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Navigation2, X } from 'lucide-react';
import {
  loadYandexMaps,
  type LatLng,
  type Ymaps,
  type YmapInstance,
  type YmapObject,
} from '@/lib/yandex-maps';

export type VehicleMode = 'auto' | 'bicycle' | 'pedestrian';

interface DeliveryNavigatorProps {
  pickup: LatLng;
  destination: LatLng;
  courier?: LatLng | null;
  routeTo: LatLng;
  vehicleMode?: VehicleMode;
  onClose?: () => void;
  orderNumber?: string;
}

interface RouteStats {
  distanceMeters: number;
  durationSec: number;
}

const AUTOFOCUS_TIMEOUT_MS = 3_000;
const CAMERA_PAN_DURATION_MS = 700;
const HEADING_LOW_PASS = 0.22;

function deltaAngle(a: number, b: number): number {
  return ((b - a + 540) % 360) - 180;
}

function formatTime(secondsAhead: number): string {
  const eta = new Date(Date.now() + secondsAhead * 1000);
  return `${eta.getHours().toString().padStart(2, '0')}:${eta.getMinutes().toString().padStart(2, '0')}`;
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}

function formatDuration(s: number): string {
  if (s < 60) return `${Math.round(s)} s`;
  if (s < 3600) return `${Math.round(s / 60)} daq`;
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return `${h}s ${m}d`;
}

export function DeliveryNavigator({
  pickup,
  destination,
  courier,
  routeTo,
  vehicleMode = 'auto',
  onClose,
  orderNumber,
}: DeliveryNavigatorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<YmapInstance | null>(null);
  const ymapsRef = useRef<Ymaps | null>(null);
  const courierMarkerRef = useRef<YmapObject | null>(null);
  const routeRef = useRef<YmapObject | null>(null);
  const snapDotRef = useRef<YmapObject | null>(null);

  const interactingRef = useRef(false);
  const autofocusTimerRef = useRef<number | null>(null);
  const headingRef = useRef(0);
  const compassCleanupRef = useRef<(() => void) | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RouteStats | null>(null);
  const [needsCompassPermission, setNeedsCompassPermission] = useState(false);

  // ── Stats update from route ─────────────────────────────────────────
  const updateStats = useCallback((route: YmapObject, ymaps: Ymaps) => {
    try {
      const routes = route.getRoutes?.();
      if (!routes || routes.getLength() === 0) return;
      const active = routes.get(0);
      const distance = (active.properties?.get?.('distance') as { value: number } | undefined)?.value;
      const durationRaw =
        (active.properties?.get?.('jamsDuration') as { value: number } | undefined)?.value ??
        (active.properties?.get?.('duration') as { value: number } | undefined)?.value;
      if (typeof distance === 'number' && typeof durationRaw === 'number') {
        setStats({ distanceMeters: distance, durationSec: durationRaw });
      }

      // Snap-to-road dot — marshrutning birinchi koordinatasi
      const paths = active.getPaths?.();
      if (paths && paths.getLength() > 0) {
        const path = paths.get(0);
        const segments = path.getSegments?.();
        if (segments && segments.length > 0) {
          const firstSeg = segments[0];
          const coords = firstSeg.geometry?.getCoordinates?.();
          if (coords && Array.isArray(coords) && coords.length > 0) {
            // segments getCoordinates returns LineString [[lat,lng],...]
            const first = Array.isArray(coords[0]) ? (coords[0] as unknown as number[]) : (coords as unknown as number[]);
            const map = mapRef.current;
            if (!map) return;
            try {
              if (snapDotRef.current) map.geoObjects.remove(snapDotRef.current);
            } catch {/* */}

            const DotLayout = ymaps.templateLayoutFactory!.createClass(
              '<div class="nav-snap-dot"></div>',
            );
            const dot = new ymaps.Placemark(
              first,
              {},
              {
                iconLayout: DotLayout as unknown as string,
                iconShape: { type: 'Circle', coordinates: [0, 0], radius: 8 },
                zIndex: 500,
                cursor: 'arrow',
              },
            );
            map.geoObjects.add(dot);
            snapDotRef.current = dot;
          }
        }
      }
    } catch {/* ignore stats parse errors */}
  }, []);

  // ── Map mount + markers + route ─────────────────────────────────────
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
            zoom: 16.5,
            controls: [],
          },
          {
            suppressMapOpenBlock: true,
            yandexMapDisablePoiInteractivity: true,
            minZoom: 4,
            maxZoom: 21,
          },
        );
        mapRef.current = map;

        // ── Courier rotatable arrow marker ─────────────────────────────
        const CourierArrowLayout = ymaps.templateLayoutFactory!.createClass(
          [
            '<div class="navigator-arrow-wrap" style="transform: rotate({{ properties.iconRotateAngle }}deg);">',
            '<svg viewBox="0 0 44 54" width="44" height="54" xmlns="http://www.w3.org/2000/svg">',
            '<defs><linearGradient id="navArrGrad" x1="0" y1="0" x2="0" y2="1">',
            '<stop offset="0%" stop-color="#fb923c"/>',
            '<stop offset="100%" stop-color="#c2410c"/>',
            '</linearGradient>',
            '<filter id="navArrShadow" x="-50%" y="-50%" width="200%" height="200%">',
            '<feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.55)"/>',
            '</filter></defs>',
            '<path d="M 22 3 L 40 46 L 22 36 L 4 46 Z" fill="url(#navArrGrad)" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" filter="url(#navArrShadow)"/>',
            '<circle cx="22" cy="24" r="3.5" fill="#fff"/>',
            '</svg>',
            '</div>',
          ].join(''),
        );

        const courierMarker = new ymaps.Placemark(
          [(courier ?? pickup).lat, (courier ?? pickup).lng],
          { iconRotateAngle: 0 },
          {
            iconLayout: CourierArrowLayout as unknown as string,
            iconShape: { type: 'Rectangle', coordinates: [[-22, -27], [22, 27]] },
            zIndex: 1000,
            cursor: 'arrow',
          },
        );
        map.geoObjects.add(courierMarker);
        courierMarkerRef.current = courierMarker;

        // ── Pickup pin (restaurant) ────────────────────────────────────
        const PickupLayout = ymaps.templateLayoutFactory!.createClass(
          '<div class="nav-pin nav-pin-pickup">' +
            '<svg width="36" height="44" viewBox="0 0 36 44"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z" fill="#f59e0b" stroke="#fff" stroke-width="2.5"/><circle cx="18" cy="18" r="6" fill="#fff"/></svg>' +
            '</div>',
        );
        const pickupPin = new ymaps.Placemark(
          [pickup.lat, pickup.lng],
          { hintContent: 'Restoran' },
          {
            iconLayout: PickupLayout as unknown as string,
            iconShape: { type: 'Rectangle', coordinates: [[-18, -44], [18, 0]] },
            zIndex: 700,
          },
        );
        map.geoObjects.add(pickupPin);

        // ── Destination pin (customer) ─────────────────────────────────
        const DestLayout = ymaps.templateLayoutFactory!.createClass(
          '<div class="nav-pin nav-pin-dest">' +
            '<svg width="36" height="44" viewBox="0 0 36 44"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z" fill="#c62020" stroke="#fff" stroke-width="2.5"/><path d="M12 19v-3l6-5 6 5v3h-2v6h-3v-4h-2v4h-3v-6z" fill="#fff"/></svg>' +
            '</div>',
        );
        const destPin = new ymaps.Placemark(
          [destination.lat, destination.lng],
          { hintContent: 'Mijoz' },
          {
            iconLayout: DestLayout as unknown as string,
            iconShape: { type: 'Rectangle', coordinates: [[-18, -44], [18, 0]] },
            zIndex: 700,
          },
        );
        map.geoObjects.add(destPin);

        // ── MultiRoute (vehicle-aware) ─────────────────────────────────
        if (ymaps.multiRouter) {
          const from = courier ?? pickup;
          const routingMode = vehicleMode;

          const multiRoute = new ymaps.multiRouter.MultiRoute(
            {
              referencePoints: [
                [from.lat, from.lng],
                [routeTo.lat, routeTo.lng],
              ],
              params: {
                routingMode,
                avoidTrafficJams: routingMode === 'auto',
                results: 1,
              },
            },
            {
              wayPointVisible: false,
              boundsAutoApply: false,
              routeActiveStrokeColor: '#fb923c',
              routeActiveStrokeWidth: 7,
              routeActiveStrokeStyle: 'solid',
              routeStrokeColor: 'rgba(251, 146, 60, 0.25)',
              routeStrokeWidth: 5,
              preventScrollableMapResetOnClick: true,
            },
          );

          // Listen for route data
          multiRoute.model?.events?.add?.('requestsuccess', () => {
            updateStats(multiRoute, ymaps);
          });

          map.geoObjects.add(multiRoute);
          routeRef.current = multiRoute;
        }

        // ── Map interaction → autofocus pause ──────────────────────────
        const onInteract = () => {
          interactingRef.current = true;
          if (autofocusTimerRef.current != null) {
            window.clearTimeout(autofocusTimerRef.current);
          }
          autofocusTimerRef.current = window.setTimeout(() => {
            interactingRef.current = false;
            const marker = courierMarkerRef.current;
            const m = mapRef.current;
            if (!marker || !m) return;
            const coords = marker.geometry?.getCoordinates?.();
            if (coords) {
              void m.panTo(coords, { flying: true, duration: CAMERA_PAN_DURATION_MS });
            }
          }, AUTOFOCUS_TIMEOUT_MS);
        };
        map.events.add(['actionbegin', 'wheel'], onInteract);

        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Xaritani yuklab bo'lmadi");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (autofocusTimerRef.current != null) window.clearTimeout(autofocusTimerRef.current);
      compassCleanupRef.current?.();
      compassCleanupRef.current = null;
      try {
        mapRef.current?.destroy();
      } catch {/* ignore */}
      mapRef.current = null;
      ymapsRef.current = null;
      courierMarkerRef.current = null;
      routeRef.current = null;
      snapDotRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Courier position updates ────────────────────────────────────────
  useEffect(() => {
    if (!courier) return;
    const marker = courierMarkerRef.current;
    const map = mapRef.current;
    if (!marker || !map) return;

    marker.geometry?.setCoordinates?.([courier.lat, courier.lng]);

    if (!interactingRef.current) {
      void map.panTo([courier.lat, courier.lng], {
        flying: true,
        duration: CAMERA_PAN_DURATION_MS,
      });
    }
  }, [courier?.lat, courier?.lng]);

  // ── Route reference points update (smooth, no rerender) ─────────────
  useEffect(() => {
    const route = routeRef.current;
    if (!route?.model?.setReferencePoints) return;
    const from = courier ?? pickup;
    try {
      route.model.setReferencePoints([
        [from.lat, from.lng],
        [routeTo.lat, routeTo.lng],
      ]);
    } catch {/* ignore */}
  }, [courier?.lat, courier?.lng, routeTo.lat, routeTo.lng, pickup.lat, pickup.lng]);

  // ── Device compass (gyroscope/magnetometer) ─────────────────────────
  const attachCompassListeners = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (compassCleanupRef.current) return; // already attached

    let raf: number | null = null;

    const handler = (e: DeviceOrientationEvent) => {
      const eAny = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
      let raw: number | null = null;
      if (typeof eAny.webkitCompassHeading === 'number') {
        raw = eAny.webkitCompassHeading;
      } else if (e.alpha != null) {
        raw = 360 - e.alpha;
      }
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
        });
      }
    };

    let absoluteAdded = false;
    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener(
        'deviceorientationabsolute' as keyof WindowEventMap,
        handler as EventListener,
      );
      absoluteAdded = true;
    }
    window.addEventListener('deviceorientation', handler);

    compassCleanupRef.current = () => {
      if (raf != null) window.cancelAnimationFrame(raf);
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
    if (typeof DOE?.requestPermission === 'function') {
      // iOS — user gesture orqali ruxsat so'rash kerak
      setNeedsCompassPermission(true);
    } else {
      attachCompassListeners();
    }
    return () => {
      compassCleanupRef.current?.();
      compassCleanupRef.current = null;
    };
  }, [attachCompassListeners]);

  const requestCompass = useCallback(async () => {
    const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof DOE?.requestPermission !== 'function') {
      attachCompassListeners();
      setNeedsCompassPermission(false);
      return;
    }
    try {
      const result = await DOE.requestPermission();
      if (result === 'granted') {
        attachCompassListeners();
        setNeedsCompassPermission(false);
      }
    } catch {/* */}
  }, [attachCompassListeners]);

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="relative h-full w-full bg-[#0d0d0f]" data-no-ptr="true">
      <div ref={containerRef} className="h-full w-full" />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d0f]/80">
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
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 text-slate-900 shadow-lg active:scale-95"
            aria-label="Yopish"
          >
            <X size={18} />
          </button>
        ) : (
          <div className="w-11" />
        )}

        {orderNumber && (
          <div className="rounded-2xl bg-white/95 px-4 py-2 shadow-lg">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {vehicleMode === 'pedestrian' ? 'Piyoda' : vehicleMode === 'bicycle' ? 'Skuter' : 'Mashina'}
            </p>
            <p className="text-sm font-black text-slate-900">#{orderNumber}</p>
          </div>
        )}

        <div className="w-11" />
      </div>

      {/* iOS Compass permission */}
      {needsCompassPermission && (
        <div className="pointer-events-auto absolute inset-x-4 top-24 z-20 rounded-2xl bg-white p-3 shadow-xl">
          <div className="flex items-center gap-3">
            <Navigation2 size={20} className="shrink-0 text-[#c62020]" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-slate-900">Kompasga ruxsat bering</p>
              <p className="text-[10px] text-slate-500">
                Marker harakat yo&apos;nalishi bo&apos;yicha aylanishi uchun
              </p>
            </div>
            <button
              type="button"
              onClick={requestCompass}
              className="rounded-xl bg-gradient-to-br from-[#c62020] to-[#f97316] px-3 py-2 text-xs font-black text-white active:scale-95"
            >
              Ruxsat
            </button>
          </div>
        </div>
      )}

      {/* HUD bottom panel */}
      {stats && !loading && <NavigatorHUD stats={stats} />}

      {/* Pin + arrow CSS — global styles */}
      <style jsx global>{`
        .navigator-arrow-wrap {
          width: 44px;
          height: 54px;
          transform-origin: 50% 50%;
          transition: transform 240ms cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }
        .nav-pin {
          width: 36px;
          height: 44px;
          transform: translate(-18px, -44px);
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.45));
        }
        .nav-snap-dot {
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: #3b82f6;
          border: 2.5px solid #fff;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.55);
          transform: translate(-8px, -8px);
        }
      `}</style>
    </div>
  );
}

function NavigatorHUD({ stats }: { stats: RouteStats }) {
  const eta = formatTime(stats.durationSec);
  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[480px]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Trafik gradient progress chizig'i */}
      <div className="h-1 w-full overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500" />
      </div>

      {/* HUD content */}
      <div className="flex items-center justify-between bg-[#131316] px-5 py-4 text-white">
        {/* Masofa */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/60">
              <path d="M8 3v18M3 8l5-5 5 5M16 21V3M21 16l-5 5-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Masofa</p>
            <p className="text-base font-black tabular-nums leading-tight">
              {formatDistance(stats.distanceMeters)}
            </p>
          </div>
        </div>

        {/* ETA klock */}
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
            {formatDuration(stats.durationSec)}
          </p>
        </div>
      </div>
    </div>
  );
}
