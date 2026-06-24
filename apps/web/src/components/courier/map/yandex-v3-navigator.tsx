'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowUp, CornerUpLeft, CornerUpRight,
  Loader2, Volume2, VolumeX, X,
} from 'lucide-react';
import { loadYandexMapsV3, type Ymaps3, type LatLng } from '@/lib/yandex-maps';
import { fetchRoute, trafficColor, type RouteManeuver, type RouteResult } from '@/lib/route-fetcher';
import { GpsWatcher, type GpsTick } from '@/lib/gps-watcher';
import { speak, setVoiceEnabled, isVoiceEnabled, maneuverPhrase } from '@/lib/nav-audio';
import { SwipeConfirm } from './swipe-confirm';
import { DeliveryNavigator } from './delivery-navigator';

type VehicleMode = 'auto' | 'pedestrian' | 'bicycle';

interface Props {
  pickup: LatLng;
  destination: LatLng;
  courier: LatLng | null;
  routeTo: LatLng;
  vehicleMode?: VehicleMode;
  onClose?: () => void;
  orderNumber?: string | number;
  stageLabel?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmBusy?: boolean;
  onGpsTick?: (t: GpsTick) => void;
}

// ── Navigatsiya sozlamalari ("live navigation" his — xarita aylanadi/egiladi) ──
const NAV_ZOOM = 17.5;
const NAV_TILT = 55;            // 3D yo'l perspektivasi
const CENTER_OFFSET_DEG = 0.00045;
const PAN_MS = 850;
const MIN_PAN_M = 1.8;
const MIN_PAN_INTERVAL_MS = 500;

function offsetAhead(lng: number, lat: number, headingDeg: number): [number, number] {
  const rad = (headingDeg * Math.PI) / 180;
  return [lng + Math.sin(rad) * CENTER_OFFSET_DEG, lat + Math.cos(rad) * CENTER_OFFSET_DEG];
}
function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const la1 = (a[1] * Math.PI) / 180;
  const la2 = (b[1] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function maneuverIcon(type: string) {
  if (/left/.test(type)) return /slight/.test(type) ? CornerUpLeft : ArrowLeft;
  if (/right/.test(type)) return /slight/.test(type) ? CornerUpRight : ArrowRight;
  return ArrowUp;
}

const COURIER_SVG = `
<svg width="46" height="56" viewBox="0 0 44 56" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="v3cs"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="rgba(0,0,0,0.65)"/></filter>
    <linearGradient id="v3cg" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#FFE082"/><stop offset="45%" stop-color="#FFB300"/><stop offset="100%" stop-color="#E65100"/>
    </linearGradient>
  </defs>
  <polygon points="22,2 44,54 22,41 0,54" fill="url(#v3cg)" stroke="#BF360C" stroke-width="1.5" filter="url(#v3cs)"/>
  <circle cx="22" cy="35" r="4.5" fill="white" opacity="0.88"/>
</svg>`;

function pinSvg(color: string): string {
  return `<svg width="34" height="44" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 4C24.6 4 30 9.4 30 16C30 24 18 44 18 44S6 24 6 16C6 9.4 11.4 4 18 4Z" fill="${color}" stroke="#fff" stroke-width="2.5"/>
    <circle cx="18" cy="16" r="6" fill="#fff" opacity="0.92"/></svg>`;
}

export function YandexV3Navigator(props: Props) {
  const {
    pickup, destination, courier: courierProp, routeTo, vehicleMode = 'pedestrian',
    onClose, orderNumber, stageLabel, confirmLabel, onConfirm, confirmBusy, onGpsTick,
  } = props;

  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [nextManeuver, setNextManeuver] = useState<RouteManeuver | null>(null);
  const [maneuverDist, setManeuverDist] = useState<number | null>(null);
  const [speedKmh, setSpeedKmh] = useState<number | null>(null);
  const [remainingM, setRemainingM] = useState<number | null>(null);
  const [voiceOn, setVoiceOn] = useState<boolean>(() => isVoiceEnabled());
  const [internalCourier, setInternalCourier] = useState<LatLng | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const ymapsRef = useRef<Ymaps3 | null>(null);
  const courierMarkerRef = useRef<any>(null);
  const routeFeatureRef = useRef<any>(null);
  const posRef = useRef<[number, number]>([courierProp?.lng ?? pickup.lng, courierProp?.lat ?? pickup.lat]);
  const headingRef = useRef(0);
  const lastPanRef = useRef<[number, number] | null>(null);
  const lastPanTickRef = useRef(0);
  const initialTotalRef = useRef<number | null>(null);

  const courier = internalCourier ?? courierProp ?? null;

  // ── Map init (v3 dark 3D) ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    loadYandexMapsV3()
      .then((ymaps3) => {
        if (cancelled || !containerRef.current) return;
        ymapsRef.current = ymaps3;
        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } = ymaps3 as any;

        const start = posRef.current;
        const map = new YMap(containerRef.current, {
          location: { center: start, zoom: NAV_ZOOM, azimuth: 0, tilt: NAV_TILT },
          mode: '3d',
        });
        map.addChild(new YMapDefaultSchemeLayer({ theme: 'dark' }));
        map.addChild(new YMapDefaultFeaturesLayer());
        mapRef.current = map;

        // Courier oltin strelka (xarita aylanadi, strelka tik turadi = oldinga)
        const cEl = document.createElement('div');
        cEl.innerHTML = COURIER_SVG;
        cEl.style.cssText = 'width:46px;height:56px;will-change:transform;';
        const cMarker = new YMapMarker({ coordinates: start, anchor: [0.5, 0.7], zIndex: 200 }, cEl);
        map.addChild(cMarker);
        courierMarkerRef.current = cMarker;

        // Destination (qizil) + pickup (sariq) pinlari
        const dEl = document.createElement('div');
        dEl.innerHTML = pinSvg('#E53935');
        map.addChild(new YMapMarker({ coordinates: [destination.lng, destination.lat], anchor: [0.5, 1], zIndex: 100 }, dEl));
        const pEl = document.createElement('div');
        pEl.innerHTML = pinSvg('#FFD600');
        map.addChild(new YMapMarker({ coordinates: [pickup.lng, pickup.lat], anchor: [0.5, 1], zIndex: 90 }, pEl));

        setReady(true);
      })
      .catch((e) => {
        console.warn('[CourierMap] v3 yuklanmadi — v2.1 fallback:', e);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      try { mapRef.current?.destroy?.(); } catch { /* noop */ }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── GPS → marker + tezlik + kamera follow ──────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const watcher = new GpsWatcher();
    const apply = (tick: GpsTick) => {
      const { lng, lat, headingDeg, speedKmh: sp } = tick;
      posRef.current = [lng, lat];
      if (headingDeg != null && !Number.isNaN(headingDeg)) headingRef.current = headingDeg;
      setInternalCourier({ lat, lng });
      setSpeedKmh(sp != null && sp >= 0 ? sp : null);
      courierMarkerRef.current?.update?.({ coordinates: [lng, lat] });
      setRemainingM(haversine([lng, lat], [routeTo.lng, routeTo.lat]));
      onGpsTick?.(tick);

      const now = Date.now();
      const last = lastPanRef.current;
      const moved = last ? haversine(last, [lng, lat]) : Infinity;
      if (moved < MIN_PAN_M && now - lastPanTickRef.current < 4000) return;
      if (now - lastPanTickRef.current < MIN_PAN_INTERVAL_MS) return;

      const center = offsetAhead(lng, lat, headingRef.current);
      mapRef.current?.update?.({
        location: { center, zoom: NAV_ZOOM, azimuth: headingRef.current, tilt: NAV_TILT, duration: PAN_MS },
      });
      lastPanRef.current = [lng, lat];
      lastPanTickRef.current = now;
    };

    watcher.start({
      onTick: (t: GpsTick) => apply(t),
      onError: () => { /* GPS yo'q — props.courier yoki pickup'da qolamiz */ },
    } as Parameters<GpsWatcher['start']>[0]);

    // GPS hali kelmaganda — props.courier (tracking) bo'lsa undan boshlaymiz
    if (courierProp) {
      setInternalCourier(courierProp);
      setRemainingM(haversine([courierProp.lng, courierProp.lat], [routeTo.lng, routeTo.lat]));
    }

    return () => watcher.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, routeTo.lat, routeTo.lng]);

  // ── Route fetch + chizish (casing + yashil Yandex uslubi) ──────────────────
  useEffect(() => {
    if (!ready || !ymapsRef.current || !mapRef.current) return;
    let cancelled = false;
    const from = { lat: posRef.current[1], lng: posRef.current[0] };
    fetchRoute(from, routeTo, vehicleMode, null)
      .then((r: RouteResult | null) => {
        if (cancelled || !r || !mapRef.current) return;
        setRoute(r);
        if (typeof r.totalDistanceMeters === 'number' && initialTotalRef.current == null) {
          initialTotalRef.current = r.totalDistanceMeters;
        }
        const { YMapFeature } = ymapsRef.current as any;
        const coords: [number, number][] = r.segments.flatMap((s) => s.coords);
        if (coords.length < 2) return;
        if (routeFeatureRef.current) {
          try { mapRef.current.removeChild(routeFeatureRef.current); } catch { /* noop */ }
        }
        // ORS odatda bitta segment (traffic=null → yashil). Yandex bo'lsa 1-segment rangi.
        const mainColor = trafficColor(r.segments[0]?.traffic ?? null);
        const feature = new YMapFeature({
          geometry: { type: 'LineString', coordinates: coords },
          style: {
            stroke: [
              { color: 'rgba(0,0,0,0.45)', width: 13 },
              { color: mainColor, width: 7 },
              { color: 'rgba(255,255,255,0.85)', width: 2 },
            ],
          },
        });
        mapRef.current.addChild(feature);
        routeFeatureRef.current = feature;
      })
      .catch(() => { /* route best-effort */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, routeTo.lat, routeTo.lng, vehicleMode]);

  // ── Keyingi burilish (maneuver) + ovozli ko'rsatma ─────────────────────────
  useEffect(() => {
    if (!route || !courier) { setNextManeuver(null); setManeuverDist(null); return; }
    let best: { m: RouteManeuver; d: number } | null = null;
    for (const m of route.maneuvers) {
      const d = haversine([courier.lng, courier.lat], [m.coords[0], m.coords[1]]);
      if (!best || d < best.d) best = { m, d };
    }
    setNextManeuver(best?.m ?? null);
    setManeuverDist(best ? Math.round(best.d) : null);
    if (best && voiceOn) {
      speak(maneuverPhrase(best.m.type, best.d), { key: `${best.m.type}:${best.m.coords.join(',')}` });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, courier?.lat, courier?.lng]);

  const toggleVoice = () => { const n = !voiceOn; setVoiceOn(n); setVoiceEnabled(n); };

  // v3 ishlamasa — ishlaydigan v2.1 navigatorga qaytamiz (launch xavfsiz)
  if (failed) return <DeliveryNavigator {...props} orderNumber={orderNumber != null ? String(orderNumber) : undefined} />;

  const ManeuverIcon = nextManeuver ? maneuverIcon(nextManeuver.type) : null;
  const maneuverText = nextManeuver ? (nextManeuver.instruction?.trim() || 'Davom eting') : null;

  // Masofa — jonli (haversine courier→maqsad) ustun; bo'lmasa route umumiy
  const distM = remainingM != null ? Math.round(remainingM) : (route ? Math.round(route.totalDistanceMeters) : null);
  const totalMin = route ? Math.round(route.totalDurationSec / 60) : null;
  const progressPct = distM != null && initialTotalRef.current
    ? Math.max(0, Math.min(1, 1 - distM / initialTotalRef.current)) : 0;

  let speedLimit: number | null = null;
  if (route) {
    for (const s of route.segments) { if (s.speedLimitKmh != null) { speedLimit = Math.round(s.speedLimitKmh); break; } }
    if (speedLimit == null) speedLimit = vehicleMode === 'auto' ? 60 : vehicleMode === 'bicycle' ? 25 : 20;
  }
  const curSpeed = speedKmh != null ? Math.max(0, Math.round(speedKmh)) : 0;
  const overLimit = speedLimit != null && curSpeed > speedLimit;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1a1b26]">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {!ready && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#1a1b26]">
          <Loader2 size={30} className="animate-spin text-amber-400" />
        </div>
      )}

      {/* Navigatsiya banneri (top, ko'k) */}
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

      {/* Yopish (top-left tepada) */}
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
                {distM != null ? (distM >= 1000 ? `${(distM / 1000).toFixed(1)} km` : `${distM} m`) : '—'}
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
          {orderNumber && <p className="mt-1 text-[10px] font-bold text-white/30">#{orderNumber}</p>}
          {confirmLabel && onConfirm && (
            <div className="mt-2.5"><SwipeConfirm label={confirmLabel} busy={confirmBusy} onConfirm={onConfirm} /></div>
          )}
        </div>
      </div>
    </div>
  );
}
