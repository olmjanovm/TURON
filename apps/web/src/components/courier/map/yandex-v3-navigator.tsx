'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Check, Loader2, Navigation2 } from 'lucide-react';
import { loadYandexMapsV3, type Ymaps3, type LatLng } from '@/lib/yandex-maps';
import { fetchRoute, type RouteResult } from '@/lib/route-fetcher';
import { GpsWatcher, type GpsTick } from '@/lib/gps-watcher';
import { DeliveryNavigator } from './delivery-navigator';

type VehicleMode = 'auto' | 'pedestrian' | 'bicycle';

interface Props {
  pickup: LatLng;
  destination: LatLng;
  courier: LatLng | null;
  routeTo: LatLng;
  vehicleMode?: VehicleMode;
  onClose?: () => void;
  orderNumber?: string;
  stageLabel?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmBusy?: boolean;
}

// Navigatsiya sozlamalari (eski miniapp CourierMap'dan — "live navigation" his) ──
const NAV_ZOOM = 17.5;
const NAV_TILT = 55;            // 3D yo'l perspektivasi
const CENTER_OFFSET_DEG = 0.00045;
const PAN_MS = 850;
const ROTATE_MS = 350;
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

function fmtDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

const COURIER_SVG = `
<svg width="44" height="52" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="v3cg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFD23F"/><stop offset="100%" stop-color="#FF9F1C"/>
    </linearGradient>
    <filter id="v3cs"><feDropShadow dx="0" dy="2.5" stdDeviation="3.5" flood-color="rgba(0,0,0,0.55)"/></filter>
  </defs>
  <polygon points="20,4 38,44 20,36 2,44" fill="url(#v3cg)" stroke="#B36B00" stroke-width="1.6" filter="url(#v3cs)"/>
  <polygon points="20,8 34,40 20,33" fill="rgba(255,255,255,0.26)"/>
</svg>`;

function pinSvg(color: string): string {
  return `<svg width="34" height="44" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 4C24.6 4 30 9.4 30 16C30 24 18 44 18 44S6 24 6 16C6 9.4 11.4 4 18 4Z" fill="${color}" stroke="#fff" stroke-width="2.5"/>
    <circle cx="18" cy="16" r="6" fill="#fff" opacity="0.92"/></svg>`;
}

export function YandexV3Navigator(props: Props) {
  const { pickup, destination, courier, routeTo, vehicleMode = 'auto', onClose, orderNumber, stageLabel, confirmLabel, onConfirm, confirmBusy } = props;

  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [remainingM, setRemainingM] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const ymapsRef = useRef<Ymaps3 | null>(null);
  const courierMarkerRef = useRef<any>(null);
  const routeFeatureRef = useRef<any>(null);
  const posRef = useRef<[number, number]>([courier?.lng ?? pickup.lng, courier?.lat ?? pickup.lat]);
  const headingRef = useRef(0);
  const lastPanRef = useRef<[number, number] | null>(null);
  const lastPanTickRef = useRef(0);

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

        // Courier arrow (xarita aylanadi, strelka tik turadi = oldinga)
        const cEl = document.createElement('div');
        cEl.innerHTML = COURIER_SVG;
        cEl.style.cssText = 'width:44px;height:52px;will-change:transform;';
        const cMarker = new YMapMarker({ coordinates: start, anchor: [0.5, 0.7], zIndex: 200 }, cEl);
        map.addChild(cMarker);
        courierMarkerRef.current = cMarker;

        // Destination (qizil) + pickup (to'q sariq) pinlari
        const dEl = document.createElement('div');
        dEl.innerHTML = pinSvg('#E53935');
        map.addChild(new YMapMarker({ coordinates: [destination.lng, destination.lat], anchor: [0.5, 1], zIndex: 100 }, dEl));
        const pEl = document.createElement('div');
        pEl.innerHTML = pinSvg('#f59e0b');
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

  // ── GPS → marker + camera follow ───────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const watcher = new GpsWatcher();
    const apply = (lng: number, lat: number, headingDeg: number | null) => {
      posRef.current = [lng, lat];
      if (headingDeg != null && !Number.isNaN(headingDeg)) headingRef.current = headingDeg;
      courierMarkerRef.current?.update?.({ coordinates: [lng, lat] });

      // Masofa (qolgan yo'l) — taxminiy: joriy → maqsad
      setRemainingM(haversine([lng, lat], [routeTo.lng, routeTo.lat]));

      const now = Date.now();
      const last = lastPanRef.current;
      const moved = last ? haversine(last, [lng, lat]) : Infinity;
      if (moved < MIN_PAN_M && now - lastPanTickRef.current < 4000) return;
      if (now - lastPanTickRef.current < MIN_PAN_INTERVAL_MS) return;

      const center = offsetAhead(lng, lat, headingRef.current);
      mapRef.current?.update?.({ location: { center, azimuth: headingRef.current, duration: PAN_MS } });
      lastPanRef.current = [lng, lat];
      lastPanTickRef.current = now;
    };

    watcher.start({
      onTick: (t: GpsTick) => apply(t.lng, t.lat, t.headingDeg),
      onError: () => { /* GPS yo'q — props.courier yoki pickup'da qolamiz */ },
    } as any);

    // GPS hali kelmaganda — props.courier (tracking) bo'lsa undan boshlaymiz
    if (courier) apply(courier.lng, courier.lat, null);

    return () => watcher.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, routeTo.lat, routeTo.lng]);

  // ── Heading-only rotation (turganda yo'nalishni kuzatish) ──────────────────
  // (kamera GPS tick'da aylanadi; bu yerda alohida sensor shart emas)

  // ── Route polyline (yashil/sariq Yandex uslubi) ────────────────────────────
  useEffect(() => {
    if (!ready || !ymapsRef.current || !mapRef.current) return;
    let cancelled = false;
    const from = { lat: posRef.current[1], lng: posRef.current[0] };
    fetchRoute(from, routeTo, vehicleMode, null)
      .then((r: RouteResult | null) => {
        if (cancelled || !r || !mapRef.current) return;
        const { YMapFeature } = ymapsRef.current as any;
        const coords: [number, number][] = r.segments.flatMap((s) => s.coords);
        if (coords.length < 2) return;
        if (routeFeatureRef.current) {
          try { mapRef.current.removeChild(routeFeatureRef.current); } catch { /* noop */ }
        }
        const feature = new YMapFeature({
          geometry: { type: 'LineString', coordinates: coords },
          style: {
            stroke: [
              { color: 'rgba(0,0,0,0.45)', width: 12 },
              { color: '#34d058', width: 7 },
              { color: '#FFFFFF', width: 2 },
            ],
          },
        });
        mapRef.current.addChild(feature);
        routeFeatureRef.current = feature;
        if (typeof r.totalDistanceMeters === 'number') setRemainingM(r.totalDistanceMeters);
      })
      .catch(() => { /* route best-effort */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, routeTo.lat, routeTo.lng, vehicleMode]);

  // v3 ishlamasa — ishlaydigan v2.1 navigatorga qaytamiz (launch xavfsiz)
  if (failed) return <DeliveryNavigator {...props} />;

  return (
    <div className="fixed inset-0 z-50 bg-[#1a1b26] text-white">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d0d0f]">
          <Loader2 size={28} className="animate-spin text-amber-400" />
        </div>
      )}

      {/* Yuqori: yopish + masofa badge */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-3" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 items-center gap-2 rounded-2xl bg-black/55 px-3 text-sm font-bold backdrop-blur-md active:scale-95"
        >
          <X size={18} /> Yopish
        </button>
        {remainingM != null && (
          <div className="flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2 font-black text-slate-900 shadow-lg">
            <Navigation2 size={16} /> {fmtDist(remainingM)}
          </div>
        )}
      </div>

      {/* Past: bosqich + tasdiqlash (mavjud props) */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[480px] rounded-t-3xl bg-[#16161a]/95 p-4 backdrop-blur-xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="min-w-0">
            {orderNumber && <p className="text-[11px] font-bold text-white/40">#{orderNumber}</p>}
            <p className="truncate text-base font-black text-white">{stageLabel ?? 'Yetkazib berish'}</p>
          </div>
          {remainingM != null && <p className="shrink-0 text-sm font-black text-amber-400">{fmtDist(remainingM)}</p>}
        </div>
        {confirmLabel && onConfirm && (
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmBusy}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-base font-black text-white shadow-[0_10px_22px_-8px_rgba(16,185,129,0.6)] active:scale-95 disabled:opacity-60"
          >
            {confirmBusy ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />} {confirmLabel}
          </button>
        )}
      </div>
    </div>
  );
}
