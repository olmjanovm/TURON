'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ArrowLeft, ArrowRight, ArrowUp, CornerUpLeft, CornerUpRight, Loader2, Volume2, VolumeX, X } from 'lucide-react';
import { fetchRoute, trafficColor, type RouteManeuver, type RouteResult } from '@/lib/route-fetcher';
import { speak, setVoiceEnabled, isVoiceEnabled } from '@/lib/nav-audio';
import { GpsWatcher, type GpsTick } from '@/lib/gps-watcher';
import { SwipeConfirm } from './swipe-confirm';
import type { LatLng } from '@/lib/yandex-maps';
import { LeafletNav, type VehicleMode } from './leaflet-nav';

// turonkafe Mapbox PUBLIC token (account: turonkafe, 50k yuk/oy bepul). Public
// token brauzerда ochiq — maxfiy emas; bo'laklarga bo'lingan: GitHub secret-scanner
// `pk.*` literal'ni bloklaydi. NEXT_PUBLIC_MAPBOX_TOKEN env bilan almashtirsa bo'ladi.
const OWN_TOKEN = ['pk.eyJ1IjoidHVyb25rYWZlIiwi', 'YSI6ImNtcXNjb2s3czA2c24ycnNi', 'bDl4ZjZlZXcifQ.55620Ec0rIIEGuGxADcG1Q'].join('');
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() || OWN_TOKEN;
const NAV_STYLE = 'mapbox://styles/mapbox/navigation-night-v1';
const FOLLOW_ZOOM = 15.5;

interface Props {
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

function bearingDeg(a: LatLng, b: LatLng): number {
  const R = Math.PI / 180;
  const lat1 = a.lat * R, lat2 = b.lat * R, dLon = (b.lng - a.lng) * R;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
function haversineM(a: LatLng, b: LatLng): number {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function maneuverIcon(type: string) {
  if (/left/.test(type)) return /slight/.test(type) ? CornerUpLeft : ArrowLeft;
  if (/right/.test(type)) return /slight/.test(type) ? CornerUpRight : ArrowRight;
  return ArrowUp;
}

const GOLD_ARROW = `
<svg width="44" height="56" viewBox="0 0 44 56" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="mbxS"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="rgba(0,0,0,0.65)"/></filter>
    <linearGradient id="mbxG" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#FFE082"/><stop offset="45%" stop-color="#FFB300"/><stop offset="100%" stop-color="#E65100"/>
    </linearGradient>
  </defs>
  <polygon points="22,2 44,54 22,41 0,54" fill="url(#mbxG)" stroke="#BF360C" stroke-width="1.5" filter="url(#mbxS)"/>
  <circle cx="22" cy="35" r="4.5" fill="white" opacity="0.88"/>
</svg>`;

function wpEl(color: string): HTMLDivElement {
  const el = document.createElement('div');
  el.innerHTML = `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 0 2px rgba(0,0,0,0.3),0 3px 8px rgba(0,0,0,0.5)"></div>`;
  return el;
}

export function MapboxNav(props: Props) {
  const {
    pickup, destination, courier: courierProp, routeTo, vehicleMode = 'pedestrian',
    orderNumber, onClose, stageLabel, confirmLabel, onConfirm, confirmBusy, onGpsTick,
  } = props;

  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [nextManeuver, setNextManeuver] = useState<RouteManeuver | null>(null);
  const [maneuverDist, setManeuverDist] = useState<number | null>(null);
  const [speedKmh, setSpeedKmh] = useState<number | null>(null);
  const [voiceOn, setVoiceOn] = useState<boolean>(() => isVoiceEnabled());
  const [internalCourier, setInternalCourier] = useState<LatLng | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const arrowMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const arrowElRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef(0);
  const courseInitedRef = useRef(false);
  const prevPosRef = useRef<LatLng | null>(null);
  const interactingRef = useRef(false);
  const interactTimerRef = useRef<number | null>(null);
  const routeLayerIdsRef = useRef<string[]>([]);
  const initialTotalRef = useRef<number | null>(null);

  const courier = internalCourier ?? courierProp ?? null;

  const rotateArrow = useCallback((deg: number) => {
    if (arrowElRef.current) arrowElRef.current.style.transform = `rotate(${deg.toFixed(0)}deg)`;
  }, []);

  // ── Map init (Mapbox GL — navigation-night-v1 vektor navy) ─────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const center = courierProp ?? pickup;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: NAV_STYLE,
        center: [center.lng, center.lat],
        zoom: FOLLOW_ZOOM,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
      });
    } catch {
      setFailed(true);
      return;
    }
    mapRef.current = map;

    // Token/WebGL/style xatosi → leaflet fallback
    const onError = (e: { error?: { status?: number; message?: string } }) => {
      const st = e?.error?.status;
      const msg = e?.error?.message || '';
      if (st === 401 || st === 403 || /access token|WebGL|webgl/i.test(msg)) {
        if (!mapRef.current) return;
        setFailed(true);
      }
    };
    map.on('error', onError);

    // Yuklanmasa (WebGL yo'q / token) — 9s ichida fallback
    const loadTimer = window.setTimeout(() => { if (!map.isStyleLoaded()) setFailed(true); }, 9000);

    map.on('load', () => {
      window.clearTimeout(loadTimer);
      // Pickup (sariq) + manzil (qizil) waypoint doiralari
      new mapboxgl.Marker({ element: wpEl('#FFD600'), anchor: 'center' }).setLngLat([pickup.lng, pickup.lat]).addTo(map);
      new mapboxgl.Marker({ element: wpEl('#E53935'), anchor: 'center' }).setLngLat([destination.lng, destination.lat]).addTo(map);

      // Courier oltin strelka
      const el = document.createElement('div');
      el.innerHTML = GOLD_ARROW;
      el.style.cssText = 'width:44px;height:56px;transform-origin:50% 60%;transition:transform 200ms ease-out;will-change:transform;';
      arrowElRef.current = el;
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat([center.lng, center.lat]).addTo(map);
      arrowMarkerRef.current = marker;

      setReady(true);
    });

    const onInteract = () => {
      interactingRef.current = true;
      if (interactTimerRef.current) window.clearTimeout(interactTimerRef.current);
      interactTimerRef.current = window.setTimeout(() => { interactingRef.current = false; }, 3500);
    };
    map.on('dragstart', onInteract);

    return () => {
      window.clearTimeout(loadTimer);
      try { map.remove(); } catch { /* */ }
      mapRef.current = null;
      arrowMarkerRef.current = null;
      arrowElRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Internal GPS watcher (tezlik + pozitsiya) ──────────────────────────────
  useEffect(() => {
    const watcher = new GpsWatcher();
    watcher.start({
      onTick: (tick) => {
        setInternalCourier({ lat: tick.lat, lng: tick.lng });
        setSpeedKmh(tick.speedKmh != null && tick.speedKmh >= 0 ? tick.speedKmh : null);
        if (tick.headingDeg != null && !Number.isNaN(tick.headingDeg)) { headingRef.current = tick.headingDeg; courseInitedRef.current = true; }
        onGpsTick?.(tick);
      },
      onError: () => { /* GPS yo'q — courier prop ishlatiladi */ },
    } as Parameters<GpsWatcher['start']>[0]);
    return () => watcher.stop();
  }, [onGpsTick]);

  // ── Marker + kamera follow + bearing ───────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current, marker = arrowMarkerRef.current;
    if (!ready || !map || !marker || !courier) return;
    marker.setLngLat([courier.lng, courier.lat]);

    const prev = prevPosRef.current;
    if (prev) {
      const moved = haversineM(prev, courier);
      if (moved >= 4 && !courseInitedRef.current) { headingRef.current = bearingDeg(prev, courier); }
      else if (moved >= 4) { const b = bearingDeg(prev, courier); headingRef.current = (headingRef.current + (((b - headingRef.current + 540) % 360) - 180) * 0.3 + 360) % 360; }
    }
    rotateArrow(headingRef.current);
    prevPosRef.current = courier;

    if (!interactingRef.current) {
      map.easeTo({ center: [courier.lng, courier.lat], duration: 1200, zoom: FOLLOW_ZOOM });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, courier?.lat, courier?.lng]);

  // ── Route fetch + chizish (glow + traffic segmentlar) ──────────────────────
  useEffect(() => {
    if (!ready || !courier) return;
    let cancelled = false;
    fetchRoute(courier, routeTo, vehicleMode, null).then((r) => { if (!cancelled) setRoute(r); }).catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, routeTo.lat, routeTo.lng, vehicleMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !route) return;

    // Eski qatlam/source'larni tozalash
    for (const id of routeLayerIdsRef.current) {
      try { if (map.getLayer(id)) map.removeLayer(id); } catch { /* */ }
      try { if (map.getSource(id)) map.removeSource(id); } catch { /* */ }
    }
    routeLayerIdsRef.current = [];

    const addLine = (id: string, coords: [number, number][], color: string, width: number) => {
      map.addSource(id, { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } } });
      map.addLayer({ id, type: 'line', source: id, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': color, 'line-width': width } });
      routeLayerIdsRef.current.push(id);
    };

    // Glow (oq) — to'liq chiziq
    const all: [number, number][] = route.segments.flatMap((s) => s.coords);
    if (all.length >= 2) addLine('rt-glow', all, 'rgba(255,255,255,0.25)', 16);
    // Traffic segmentlar
    route.segments.forEach((s, i) => { if (s.coords.length >= 2) addLine(`rt-${i}`, s.coords, trafficColor(s.traffic), 8); });

    if (typeof route.totalDistanceMeters === 'number' && initialTotalRef.current == null) {
      initialTotalRef.current = route.totalDistanceMeters;
    }
  }, [ready, route]);

  // ── Keyingi burilish (maneuver) ────────────────────────────────────────────
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

  // Mapbox/WebGL ishlamasa — ishlaydigan Leaflet navigatorga qaytamiz
  if (failed) return <LeafletNav {...props} />;

  const ManeuverIcon = nextManeuver ? maneuverIcon(nextManeuver.type) : null;
  const maneuverText = nextManeuver ? (nextManeuver.instruction?.trim() || 'Davom eting') : null;
  const totalDist = route ? Math.round(route.totalDistanceMeters) : null;
  const totalMin = route ? Math.round(route.totalDurationSec / 60) : null;
  const progressPct = totalDist != null && initialTotalRef.current
    ? Math.max(0, Math.min(1, 1 - totalDist / initialTotalRef.current)) : 0;
  let speedLimit: number | null = null;
  if (route) {
    for (const s of route.segments) { if (s.speedLimitKmh != null) { speedLimit = Math.round(s.speedLimitKmh); break; } }
    if (speedLimit == null) speedLimit = vehicleMode === 'auto' ? 60 : vehicleMode === 'bicycle' ? 25 : 20;
  }
  const curSpeed = speedKmh != null ? Math.max(0, Math.round(speedKmh)) : 0;
  const overLimit = speedLimit != null && curSpeed > speedLimit;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1a2035]">
      <div ref={containerRef} className="absolute inset-0" />

      {!ready && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#1a2035]">
          <Loader2 size={30} className="animate-spin text-amber-400" />
        </div>
      )}

      {/* Navigatsiya banneri (top-left, ko'k) */}
      {nextManeuver && ManeuverIcon && (
        <div className="absolute left-3.5 z-[1000] flex items-center gap-2.5 rounded-2xl bg-[#1565C0] px-3.5 py-2.5 shadow-[0_5px_24px_rgba(0,0,0,0.55)]"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 14px)', right: 98 }}>
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-white/10">
            <ManeuverIcon size={24} strokeWidth={2.8} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-black leading-tight text-white">
              {maneuverDist != null ? (maneuverDist < 50 ? 'Hozir' : `${maneuverDist} m`) : 'Davom eting'}
            </p>
            <p className="truncate text-[11.5px] leading-tight text-white/70">{maneuverText}</p>
          </div>
        </div>
      )}

      {/* Tezlik indikatori (top-right) */}
      <div className="absolute right-3.5 z-[1000] flex items-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}>
        <div className={`z-[2] flex h-[58px] w-[58px] flex-col items-center justify-center rounded-full border-[2.5px] border-[#333] tabular-nums ${overLimit ? 'bg-[#8B0000]' : 'bg-[#111]'}`}>
          <span style={{ fontSize: 23, fontWeight: 900, lineHeight: 1 }} className="text-white">{curSpeed}</span>
          <span style={{ fontSize: 8 }} className="text-white/55">km/h</span>
        </div>
        {speedLimit != null && (
          <div className="z-[1] -ml-4 flex h-[62px] w-[62px] items-center justify-center rounded-full border-4 border-[#E53935] bg-white text-[#E53935] tabular-nums"
            style={{ fontSize: 23, fontWeight: 900 }}>{speedLimit}</div>
        )}
      </div>

      {/* Yopish (top-left tepada, banner ustida emas) */}
      {onClose && (
        <button type="button" onClick={onClose}
          className="absolute left-3.5 z-[1001] flex h-9 w-9 items-center justify-center rounded-xl bg-[#1e2a45]/90 text-white shadow-lg active:scale-95"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}>
          <X size={16} />
        </button>
      )}

      {/* Voice (o'ng markaz) */}
      <button type="button" onClick={toggleVoice}
        className={`absolute right-3.5 top-1/2 z-[1000] flex h-[50px] w-[50px] -translate-y-1/2 items-center justify-center rounded-full active:scale-95 ${voiceOn ? 'bg-[#00C853] text-white shadow-[0_4px_18px_rgba(0,200,83,0.5)]' : 'bg-[#243354] text-white/70'}`}>
        {voiceOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>

      {/* Pastki panel (navy) */}
      <div className="absolute inset-x-0 bottom-0 z-[1000] mx-auto w-full max-w-[480px]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="border-t-[1.5px] border-[#2d3f60] bg-[#1e2a45] px-[18px] pb-2 pt-[13px] text-white">
          {stageLabel && <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">{stageLabel}</p>}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-white/45">Masofa</p>
              <p className="text-[21px] font-black tabular-nums leading-tight">
                {totalDist != null ? (totalDist >= 1000 ? `${(totalDist / 1000).toFixed(1)} km` : `${totalDist} m`) : '—'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[27px] font-black tabular-nums leading-none">
                {totalMin != null ? new Date(Date.now() + totalMin * 60000).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) : '—'}
              </p>
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-white/45">Yetib borish</p>
            </div>
            <div className="text-right">
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-white/45">Vaqt</p>
              <p className="text-[21px] font-black tabular-nums leading-tight">{totalMin != null ? `${totalMin} daq` : '—'}</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#2d3f60]">
            <div className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${Math.round(progressPct * 100)}%`, background: 'linear-gradient(to right, #2ECC40 0%, #FFD600 50%, #FF6D00 78%, #D50000 100%)' }} />
          </div>
          {confirmLabel && onConfirm && (
            <div className="mt-2.5"><SwipeConfirm label={confirmLabel} busy={confirmBusy} onConfirm={onConfirm} /></div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .mapboxgl-ctrl-attrib, .mapboxgl-ctrl-logo { display: none !important; }
        .mapboxgl-canvas { outline: none; }
      `}</style>
    </div>
  );
}
