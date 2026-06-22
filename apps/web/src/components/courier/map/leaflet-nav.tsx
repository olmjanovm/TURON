'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // MAJBURIY — busiz tiles joylashmaydi (bo'sh xarita)
import { ArrowLeft, ArrowRight, ArrowUp, CornerUpLeft, CornerUpRight, Loader2, Volume2, VolumeX, X } from 'lucide-react';
import { fetchRoute, trafficColor, type RouteManeuver, type RouteResult } from '@/lib/route-fetcher';
import { speak, setVoiceEnabled, isVoiceEnabled } from '@/lib/nav-audio';
import { GpsWatcher, type GpsTick } from '@/lib/gps-watcher';
import { SwipeConfirm } from './swipe-confirm';
import type { LatLng } from '@/lib/yandex-maps';

export type VehicleMode = 'auto' | 'bicycle' | 'pedestrian';

interface LeafletNavProps {
  pickup: LatLng;
  destination: LatLng;
  courier?: LatLng | null;
  routeTo: LatLng;
  vehicleMode?: VehicleMode;
  orderNumber?: string | number;
  onClose?: () => void;
  stageLabel?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmBusy?: boolean;
  onGpsTick?: (t: GpsTick) => void;
}

const CHASE_ZOOM = 18;
const HYPER_ZOOM = 19;
const HYPER_RADIUS_M = 100;
// Carto DARK raster — bepul, dark Navigator rangida, raster (qotmaydi).
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

function haversineM(a: LatLng, b: LatLng): number {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function gpsBearing(from: LatLng, to: LatLng): number {
  const toR = Math.PI / 180, f1 = from.lat * toR, f2 = to.lat * toR, dL = (to.lng - from.lng) * toR;
  const y = Math.sin(dL) * Math.cos(f2);
  const x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dL);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
function deltaAngle(a: number, b: number): number {
  let d = ((b - a + 540) % 360) - 180;
  return d;
}

function maneuverIcon(type: string): typeof ArrowUp {
  if (type.includes('left') && type.includes('sharp')) return CornerUpLeft;
  if (type.includes('right') && type.includes('sharp')) return CornerUpRight;
  if (type.includes('left')) return ArrowLeft;
  if (type.includes('right')) return ArrowRight;
  return ArrowUp;
}

export function LeafletNav({
  pickup, destination, courier: courierProp, routeTo, vehicleMode = 'pedestrian',
  orderNumber, onClose, stageLabel, confirmLabel, onConfirm, confirmBusy, onGpsTick,
}: LeafletNavProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const courierMarkerRef = useRef<L.Marker | null>(null);
  const arrowElRef = useRef<HTMLElement | null>(null);
  const routeLayersRef = useRef<L.Polyline[]>([]);
  const maneuverLayersRef = useRef<L.Marker[]>([]);
  const fallbackLineRef = useRef<L.Polyline | null>(null);
  const interactingRef = useRef(false);
  const autofocusTimerRef = useRef<number | null>(null);
  const hyperRef = useRef(false);
  const headingRef = useRef(0);
  const courseInitedRef = useRef(false);
  const bearingPrevRef = useRef<LatLng | null>(null);

  const [internalCourier, setInternalCourier] = useState<LatLng | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [nextManeuver, setNextManeuver] = useState<RouteManeuver | null>(null);
  const [maneuverDist, setManeuverDist] = useState<number | null>(null);
  const [voiceOn, setVoiceOn] = useState<boolean>(() => isVoiceEnabled());

  const courier = useMemo<LatLng | null>(
    () => internalCourier ?? courierProp ?? null,
    [internalCourier?.lat, internalCourier?.lng, courierProp?.lat, courierProp?.lng],
  );

  // Strelkani aylantirish — element kech tayyor bo'lsa qayta so'raymiz
  const rotateArrow = useCallback((deg: number) => {
    if (!arrowElRef.current) {
      arrowElRef.current = (courierMarkerRef.current?.getElement()?.querySelector('.lnav-arrow') as HTMLElement) ?? null;
    }
    if (arrowElRef.current) arrowElRef.current.style.transform = `rotate(${deg.toFixed(0)}deg)`;
  }, []);

  // ── Map mount (bir marta) ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const center = courierProp ?? pickup;
    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: CHASE_ZOOM,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true, // past quvvat uchun
    });
    L.tileLayer(DARK_TILES, { subdomains: 'abcd', maxZoom: 20, detectRetina: true }).addTo(map);
    mapRef.current = map;

    // Pickup pin (amber)
    L.marker([pickup.lat, pickup.lng], {
      icon: L.divIcon({
        html: '<div class="lnav-pin lnav-pin-pickup"><svg width="34" height="42" viewBox="0 0 36 44"><path d="M18 0C8 0 0 8 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8 28 0 18 0z" fill="#f59e0b" stroke="#fff" stroke-width="3"/><circle cx="18" cy="18" r="6" fill="#fff"/></svg></div>',
        className: '', iconSize: [34, 42], iconAnchor: [17, 42],
      }),
    }).addTo(map);
    // Destination pin (red)
    L.marker([destination.lat, destination.lng], {
      icon: L.divIcon({
        html: '<div class="lnav-pin lnav-pin-dest"><svg width="34" height="42" viewBox="0 0 36 44"><path d="M18 0C8 0 0 8 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8 28 0 18 0z" fill="#c62020" stroke="#fff" stroke-width="3"/><path d="M12 19v-3l6-5 6 5v3h-2v6h-3v-4h-2v4h-3v-6z" fill="#fff"/></svg></div>',
        className: '', iconSize: [34, 42], iconAnchor: [17, 42],
      }),
    }).addTo(map);

    // Courier arrow (oltin chevron) — kompas bilan aylanadi
    const cm = L.marker([center.lat, center.lng], {
      icon: L.divIcon({
        html: '<div class="lnav-arrow"><svg viewBox="0 0 48 60" width="44" height="55"><defs><linearGradient id="lnavG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFD60A"/><stop offset="100%" stop-color="#F5A300"/></linearGradient></defs><circle cx="24" cy="46" r="9" fill="rgba(255,214,10,0.28)"/><path d="M 24 3 L 44 52 L 24 40 L 4 52 Z" fill="url(#lnavG)" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><circle cx="24" cy="28" r="4" fill="#fff"/></svg></div>',
        className: '', iconSize: [44, 55], iconAnchor: [22, 33],
      }),
      zIndexOffset: 1000,
    }).addTo(map);
    courierMarkerRef.current = cm;
    arrowElRef.current = (cm.getElement()?.querySelector('.lnav-arrow') as HTMLElement) ?? null;

    // Konteyner o'lchami kech tayyor bo'lsa (Telegram WebView) — majburan moslash
    window.setTimeout(() => { try { map.invalidateSize(); } catch {/* */} }, 120);
    window.setTimeout(() => { try { map.invalidateSize(); } catch {/* */} }, 400);

    const onInteract = () => {
      interactingRef.current = true;
      if (autofocusTimerRef.current != null) window.clearTimeout(autofocusTimerRef.current);
      autofocusTimerRef.current = window.setTimeout(() => {
        interactingRef.current = false;
        const c = courierMarkerRef.current?.getLatLng();
        if (c) map.setView(c, hyperRef.current ? HYPER_ZOOM : CHASE_ZOOM, { animate: true });
      }, 3000);
    };
    map.on('dragstart zoomstart', onInteract);

    setMapReady(true);

    return () => {
      if (autofocusTimerRef.current != null) window.clearTimeout(autofocusTimerRef.current);
      try { map.remove(); } catch {/* */}
      mapRef.current = null;
      courierMarkerRef.current = null;
      arrowElRef.current = null;
      routeLayersRef.current = [];
      maneuverLayersRef.current = [];
      fallbackLineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Internal GPS watcher ───────────────────────────────────────────────
  useEffect(() => {
    const watcher = new GpsWatcher();
    watcher.start({
      onTick: (tick) => { setInternalCourier({ lat: tick.lat, lng: tick.lng }); onGpsTick?.(tick); },
      onError: () => {/* */},
    });
    return () => watcher.stop();
  }, [onGpsTick]);

  // ── Route chizish ──────────────────────────────────────────────────────
  const clearRoute = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const l of routeLayersRef.current) { try { map.removeLayer(l); } catch {/* */} }
    routeLayersRef.current = [];
    for (const m of maneuverLayersRef.current) { try { map.removeLayer(m); } catch {/* */} }
    maneuverLayersRef.current = [];
  }, []);

  const drawRoute = useCallback((r: RouteResult) => {
    const map = mapRef.current;
    if (!map) return;
    clearRoute();
    if (fallbackLineRef.current) { try { map.removeLayer(fallbackLineRef.current); } catch {/* */} fallbackLineRef.current = null; }
    for (const seg of r.segments) {
      if (!seg.coords || seg.coords.length < 2) continue;
      const latlngs = seg.coords.map(([lng, lat]) => [lat, lng]) as [number, number][];
      const color = trafficColor(seg.traffic);
      const casing = L.polyline(latlngs, { color: '#0b1220', weight: 12, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }).addTo(map);
      const main = L.polyline(latlngs, { color, weight: 8, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(map);
      routeLayersRef.current.push(casing, main);
    }
    // Oq manyovr strelkalari
    for (let i = 0; i < r.maneuvers.length; i++) {
      const m = r.maneuvers[i];
      if (!m.coords) continue;
      const from = { lat: m.coords[1], lng: m.coords[0] };
      const nx = r.maneuvers[i + 1]?.coords ?? r.snappedEnd;
      const brng = gpsBearing(from, { lat: nx[1], lng: nx[0] });
      const arrow = L.marker([from.lat, from.lng], {
        icon: L.divIcon({
          html: `<div class="lnav-mvr" style="transform:rotate(${brng.toFixed(0)}deg)"><svg viewBox="0 0 28 28" width="24" height="24"><path d="M14 4 L23 22 L14 17 L5 22 Z" fill="#fff" stroke="#13233A" stroke-width="2.4" stroke-linejoin="round"/></svg></div>`,
          className: '', iconSize: [24, 24], iconAnchor: [12, 12],
        }),
        zIndexOffset: 500,
      }).addTo(map);
      maneuverLayersRef.current.push(arrow);
    }
  }, [clearRoute]);

  const drawFallback = useCallback((from: LatLng, to: LatLng) => {
    const map = mapRef.current;
    if (!map) return;
    if (fallbackLineRef.current) { try { map.removeLayer(fallbackLineRef.current); } catch {/* */} }
    fallbackLineRef.current = L.polyline([[from.lat, from.lng], [to.lat, to.lng]], {
      color: '#2563eb', weight: 5, opacity: 0.85, dashArray: '8 10', lineCap: 'round',
    }).addTo(map);
  }, []);

  const refresh = useCallback(async (from: LatLng, to: LatLng) => {
    const result = await fetchRoute(from, to, vehicleMode, null);
    if (!result || result.segments.length === 0) { drawFallback(from, to); return; }
    setRoute(result);
    drawRoute(result);
  }, [vehicleMode, drawRoute, drawFallback]);

  // Birinchi route (kuryer paydo bo'lganda)
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (!mapReady || !courier || fetchedRef.current) return;
    fetchedRef.current = true;
    void refresh(courier, routeTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, courier != null]);

  // routeTo o'zgarsa (bosqich) — qayta
  const lastToRef = useRef<string>('');
  useEffect(() => {
    if (!mapReady || !courier || !fetchedRef.current) return;
    const key = `${routeTo.lat},${routeTo.lng}`;
    if (lastToRef.current === key) return;
    lastToRef.current = key;
    void refresh(courier, routeTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeTo.lat, routeTo.lng, mapReady]);

  // ── Follow + hyperzoom + course (GPS harakat yo'nalishi) ───────────────
  useEffect(() => {
    const map = mapRef.current, marker = courierMarkerRef.current;
    if (!map || !marker || !courier) return;
    marker.setLatLng([courier.lat, courier.lng]);

    const distDest = haversineM(courier, destination);
    if (distDest <= HYPER_RADIUS_M && !hyperRef.current) {
      hyperRef.current = true;
      if (!interactingRef.current) map.setView([courier.lat, courier.lng], HYPER_ZOOM, { animate: true });
      void speak('Manzilga yaqin keldingiz, kirish joyini topshiring', { key: `hz_${destination.lat}` });
    } else if (distDest > HYPER_RADIUS_M && hyperRef.current) {
      hyperRef.current = false;
    }
    if (!interactingRef.current) map.panTo([courier.lat, courier.lng], { animate: true, duration: 0.6 });

    // Course (harakat yo'nalishi) → strelka
    const prev = bearingPrevRef.current;
    if (prev) {
      const moved = haversineM(prev, courier);
      if (moved >= 4) {
        const b = gpsBearing(prev, courier);
        if (!courseInitedRef.current) { headingRef.current = b; courseInitedRef.current = true; }
        else headingRef.current = (headingRef.current + deltaAngle(headingRef.current, b) * 0.3 + 360) % 360;
        rotateArrow(headingRef.current);
      }
    }
    bearingPrevRef.current = courier;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courier?.lat, courier?.lng, destination.lat, destination.lng]);

  // ── Kompas (telefon yo'nalishi) → strelka ──────────────────────────────
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
      let raw: number | null = null;
      const screenAngle = (typeof screen !== 'undefined' && screen.orientation?.angle) || 0;
      if (typeof e.webkitCompassHeading === 'number') raw = e.webkitCompassHeading - screenAngle;
      else if ((e.absolute || e.type === 'deviceorientationabsolute') && e.alpha != null) raw = (360 - e.alpha) + screenAngle;
      else return;
      raw = ((raw % 360) + 360) % 360;
      // Harakat yo'q (course init bo'lmagan) bo'lsa kompasni ishlatamiz
      if (!courseInitedRef.current) {
        headingRef.current = raw;
        rotateArrow(raw);
      }
    };
    const DOE = (typeof DeviceOrientationEvent !== 'undefined'
      ? (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
      : null);
    if (DOE?.requestPermission) { DOE.requestPermission().then((r) => { if (r === 'granted') addListeners(); }).catch(() => {/* */}); }
    else addListeners();
    function addListeners() {
      window.addEventListener('deviceorientationabsolute' as keyof WindowEventMap, handler as EventListener);
      window.addEventListener('deviceorientation', handler);
    }
    return () => {
      window.removeEventListener('deviceorientationabsolute' as keyof WindowEventMap, handler as EventListener);
      window.removeEventListener('deviceorientation', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Maneuver (keyingi burilish) ────────────────────────────────────────
  useEffect(() => {
    if (!route || !courier) { setNextManeuver(null); setManeuverDist(null); return; }
    let best: { m: RouteManeuver; d: number } | null = null;
    for (const m of route.maneuvers) {
      const d = haversineM(courier, { lat: m.coords[1], lng: m.coords[0] });
      if (!best || d < best.d) best = { m, d };
    }
    setNextManeuver(best?.m ?? null);
    setManeuverDist(best ? Math.round(best.d) : null);
  }, [route, courier?.lat, courier?.lng]);

  const toggleVoice = useCallback(() => { const n = !voiceOn; setVoiceOn(n); setVoiceEnabled(n); }, [voiceOn]);

  const ManeuverIcon = nextManeuver ? maneuverIcon(nextManeuver.type) : null;
  const maneuverText = nextManeuver ? (nextManeuver.instruction?.trim() || 'Davom eting') : null;
  const totalDist = route ? Math.round(route.totalDistanceMeters) : null;
  const totalMin = route ? Math.round(route.totalDurationSec / 60) : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0a0c]">
      <div ref={containerRef} className="absolute inset-0 lnav-tilt" />

      {/* Yuqori scrim */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-24"
        style={{ background: 'linear-gradient(to bottom, rgba(10,10,12,0.7), transparent)' }} />

      {!mapReady && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0a0a0c]/80">
          <Loader2 size={30} className="animate-spin text-amber-400" />
        </div>
      )}

      {/* Top controls */}
      <div className="absolute inset-x-0 z-20 flex items-start justify-between px-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <div className="flex items-center gap-2">
          {onClose && (
            <button type="button" onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/95 text-slate-900 shadow-xl active:scale-95">
              <X size={16} />
            </button>
          )}
          {orderNumber && (
            <div className="rounded-2xl bg-white/95 px-3 py-1.5 shadow-xl">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {vehicleMode === 'pedestrian' ? 'Piyoda' : vehicleMode === 'bicycle' ? 'Skuter' : 'Mashina'}
              </p>
              <p className="text-sm font-black leading-tight text-slate-900">#{orderNumber}</p>
            </div>
          )}
        </div>
        <button type="button" onClick={toggleVoice}
          className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-xl active:scale-95 ${voiceOn ? 'bg-emerald-500 text-white' : 'bg-white/95 text-slate-500'}`}>
          {voiceOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* Manyovr karta — ixcham chap-yuqori */}
      {nextManeuver && ManeuverIcon && (
        <div className="pointer-events-none absolute left-3 z-20"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 84px)' }}>
          <div className="flex max-w-[58vw] items-center gap-2 rounded-2xl bg-[#1f6fe5]/95 px-2.5 py-1.5 shadow-xl backdrop-blur-sm">
            <ManeuverIcon size={26} strokeWidth={3} className="shrink-0 text-white" />
            <div className="min-w-0">
              {maneuverDist != null && (
                <p className="text-lg font-black leading-none text-white tabular-nums">
                  {maneuverDist < 50 ? 'Hozir' : `${maneuverDist} m`}
                </p>
              )}
              <p className="truncate text-[11px] font-bold leading-tight text-white/85">{maneuverText}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pastki HUD */}
      <div className="absolute inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[480px]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="bg-[#0f0f12] px-5 pb-3 pt-3 text-white shadow-[0_-12px_24px_-4px_rgba(0,0,0,0.6)]">
          {stageLabel && <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-400">{stageLabel}</p>}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Masofa</p>
              <p className="text-base font-black tabular-nums leading-tight">
                {totalDist != null ? (totalDist >= 1000 ? `${(totalDist / 1000).toFixed(1)} km` : `${totalDist} m`) : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Vaqt</p>
              <p className="text-base font-black tabular-nums leading-tight">{totalMin != null ? `${totalMin} daq` : '—'}</p>
            </div>
          </div>
          {confirmLabel && onConfirm && (
            <div className="mt-3"><SwipeConfirm label={confirmLabel} busy={confirmBusy} onConfirm={onConfirm} /></div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .lnav-tilt { /* yengil first-person tilt (raster — qotmaydi) */ }
        .lnav-arrow { width: 44px; height: 55px; transform-origin: 50% 60%; transition: transform 200ms ease-out; will-change: transform; }
        .lnav-mvr { width: 24px; height: 24px; transform-origin: 50% 50%; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.6)); }
        .leaflet-container { background: #0a0a0c; font-family: inherit; }
        .leaflet-container .leaflet-control-attribution { display: none; }
      `}</style>
    </div>
  );
}
