'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowUp, CornerUpLeft, CornerUpRight, Loader2, X,
} from 'lucide-react';
import { loadYandexMapsV3, type Ymaps3, type LatLng } from '@/lib/yandex-maps';
import { fetchRoute, type RouteManeuver, type RouteResult } from '@/lib/route-fetcher';
import { GpsWatcher, type GpsTick } from '@/lib/gps-watcher';
import { startCompass } from '@/lib/compass';
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
  pickupLabel?: string;
  destinationLabel?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmBusy?: boolean;
  onGpsTick?: (t: GpsTick) => void;
}

// ── Navigatsiya sozlamalari (course-up "live nav") ──────────────────────────
// ⚠️ ymaps3 RASMIY: tilt/azimuth `camera` obyektida (location EMAS), RADIANDA;
// tilt MAX 50°, azimuth -π..π. Kamera = map.setCamera(), markaz = map.setLocation()
// (map.update() YO'Q). Avval shu xato edi → xarita aylanmagan/ko'chmagan.
const NAV_ZOOM = 18.2;
const TILT_RAD = 45 * (Math.PI / 180); // 45° 3D perspektiva (max 50°)
const CENTER_OFFSET_DEG = 0.00045; // strelka past-uchdan, yo'l oldinda
const PAN_MS = 600;
const CAM_MIN_INTERVAL_MS = 200; // kamera yangilanishlari orasidagi min interval (lag↓)
const AUTO_FOCUS_MS = 3000;       // swipe'dan keyin shuncha sokinlikда qayta markazlanadi
const MOVE_BEARING_MIN_M = 6;     // harakat bearing'i uchun min siljish
const MIN_SPEED_BEARING_KMH = 3;  // GPS bearing FAQAT harakatda (turganda shovqin → spin)
const AZ_THRESHOLD_DEG = 3;       // shuncha gradusdan kam aylanishni e'tiborsiz (jitter/lag)

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
function bearing(a: [number, number], b: [number, number]): number {
  const r = Math.PI / 180;
  const lat1 = a[1] * r, lat2 = b[1] * r, dLon = (b[0] - a[0]) * r;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
// Heading (gradus, 0-360 shimoldan soat strelkasi) → ymaps3 azimuth (radian, -π..π).
// Course-up: heading yo'nalishi xarita TEPASIDA. Agar teskari aylansa — belgini (-) qil.
function headingToAzimuthRad(deg: number): number {
  let rad = (((deg % 360) + 360) % 360) * (Math.PI / 180); // 0..2π
  if (rad > Math.PI) rad -= 2 * Math.PI;                     // -π..π
  return rad;
}
// Marshrut bo'ylab berilgan nuqtadagi harakat yo'nalishi (world bearing, gradus).
function bearingAlongRoute(coords: [number, number][], pt: [number, number]): number {
  let bi = 0, bd = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const d = haversine(coords[i], pt);
    if (d < bd) { bd = d; bi = i; }
  }
  const j = Math.min(coords.length - 1, bi + 2);
  return j > bi ? bearing(coords[bi], coords[j]) : 0;
}
function maneuverIcon(type: string) {
  if (/left/.test(type)) return /slight/.test(type) ? CornerUpLeft : ArrowLeft;
  if (/right/.test(type)) return /slight/.test(type) ? CornerUpRight : ArrowRight;
  return ArrowUp;
}

// Courier oltin strelka — har doim tik (xarita aylanadi, strelka oldinga qaraydi)
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

// Burilish STRELKASI — OQ, to'q outline (Yandex Navigator uslubi). O'z ramkasida
// YUQORIGA qaraydi; harakat yo'nalishiga (world bearing − map heading) aylantiriladi.
function turnArrowSvg(): string {
  // Uzun OQ strelka: dum (chiziq) + boshi. ~62px ≈ 2sm. To'q nozik outline (yashil
  // marshrutda ko'rinishi uchun). O'z ramkasida YUQORIGA qaraydi.
  return `<svg width="16" height="62" viewBox="0 0 16 62" xmlns="http://www.w3.org/2000/svg">
    <line x1="8" y1="59" x2="8" y2="22" stroke="#16202e" stroke-width="7" stroke-linecap="round"/>
    <line x1="8" y1="59" x2="8" y2="22" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M8 2 L15 22 L8 16 L1 22 Z" fill="#ffffff" stroke="#16202e" stroke-width="1.4" stroke-linejoin="round"/>
  </svg>`;
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
  const [internalCourier, setInternalCourier] = useState<LatLng | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const ymapsRef = useRef<Ymaps3 | null>(null);
  const courierMarkerRef = useRef<any>(null);
  const routeFeatureRef = useRef<any>(null);
  const posRef = useRef<[number, number]>([courierProp?.lng ?? pickup.lng, courierProp?.lat ?? pickup.lat]);
  const smoothedHeadingRef = useRef(0);
  const initialTotalRef = useRef<number | null>(null);
  const routeReqRef = useRef('');
  const connectorFeatureRef = useRef<any>(null);    // turgan joy → marshrut boshi
  const endConnectorRef = useRef<any>(null);         // marshrut oxiri → aniq eshik
  const maneuverMarkersRef = useRef<any[]>([]);      // burilish nuqtalari
  // Auto-focus (swipe paytida to'xtaydi, 3s sokinlikдан keyin qaytadi)
  const interactingRef = useRef(false);
  const interactTimerRef = useRef<number | null>(null);
  const lastCamRef = useRef(0);
  const lastAzDegRef = useRef(0);     // oxirgi qo'llangan azimut (threshold uchun)
  const lastCompassAtRef = useRef(0); // oxirgi kompas o'qishi (GPS bearing fallback uchun)
  const lastLocRef = useRef<[number, number] | null>(null); // oxirgi pan markazi (move-gate)

  const courier = internalCourier ?? courierProp ?? null;

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  ⚠️  KOMPAS + KAMERA (course-up) — ISHLAYDI, O'ZGARTIRMA  ⚠️                ║
  // ║  setHeading + applyCamera + kompas effekti + GPS apply heading qismi —     ║
  // ║  birgalikda xaritani DOIM OLDINGA qaratadi (kuryer yursa/burilsa aylanadi).║
  // ║  KAFOLAT: applyCamera HAR SAFAR to'liq location (center+zoom+AZIMUT+tilt)  ║
  // ║  beradi → azimut hech qachon 0 ga tushmaydi. Bu blokка TEGMA — boshqa AI'  ║
  // ║  lar uchun ham: yaxshi ishlayapti, o'zgartirmang. Yangi narsa ALOHIDA.     ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  const setHeading = useCallback((target: number) => {
    if (Number.isNaN(target)) return;
    const cur = smoothedHeadingRef.current;
    const diff = ((target - cur + 540) % 360) - 180; // qisqa yoy
    smoothedHeadingRef.current = (cur + diff * 0.2 + 360) % 360; // low-pass silliqlash
  }, []);

  const applyCamera = useCallback(() => {
    const map = mapRef.current;
    if (!map || interactingRef.current) return;        // swipe paytida follow YO'Q
    const now = Date.now();
    if (now - lastCamRef.current < CAM_MIN_INTERVAL_MS) return;
    lastCamRef.current = now;
    const [lng, lat] = posRef.current;
    const heading = smoothedHeadingRef.current;
    try {
      // POZITSIYA: faqat kuryer SILJIGANDA pan (turganда qayta pan YO'Q → lag/swing yo'q).
      const lastLoc = lastLocRef.current;
      if (!lastLoc || haversine(lastLoc, [lng, lat]) > 1.5) {
        lastLocRef.current = [lng, lat];
        map.setLocation({ center: offsetAhead(lng, lat, heading), zoom: NAV_ZOOM, duration: PAN_MS });
      }
      // AYLANISH: faqat heading sezilarli o'zgarganда, INSTANT (animatsiyasiz → wrap-spin
      // YO'Q + uzluksiz 60fps re-render lag'i YO'Q).
      const azDelta = Math.abs(((heading - lastAzDegRef.current + 540) % 360) - 180);
      if (azDelta >= AZ_THRESHOLD_DEG) {
        lastAzDegRef.current = heading;
        map.setCamera({ azimuth: headingToAzimuthRad(heading), tilt: TILT_RAD });
        // Strelkalarni moslab aylantirish (transform = kompozit, arzon — filtr/transition YO'Q).
        const arrows = maneuverMarkersRef.current;
        for (let k = 0; k < arrows.length; k++) {
          const a = arrows[k];
          if (a?.el) a.el.style.transform = `rotate(${(a.bearingDeg - heading).toFixed(1)}deg)`;
        }
      }
    } catch { /* noop */ }
  }, []);

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
          // ymaps3 TO'G'RI: location = markaz/zoom; camera = tilt/azimuth (RADIAN).
          // (Avval tilt/azimuth location'da + mode:'3d' edi → e'tiborga olinmagan.)
          location: { center: start, zoom: NAV_ZOOM },
          camera: { tilt: TILT_RAD, azimuth: 0 },
        });
        map.addChild(new YMapDefaultSchemeLayer({ theme: 'dark' }));
        map.addChild(new YMapDefaultFeaturesLayer());
        mapRef.current = map;

        // Courier oltin strelka (tik turadi — xarita aylanadi)
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

        // ⚠️ AUTO-FOCUS: foydalanuvchi xaritani surса (swipe/zoom) follow to'xtaydi;
        // 3s hech qanday teginish bo'lmasa — qayta kuryerga markazlanadi. O'ZGARTIRMA.
        const onInteract = () => {
          interactingRef.current = true;
          if (interactTimerRef.current) window.clearTimeout(interactTimerRef.current);
          interactTimerRef.current = window.setTimeout(() => {
            interactingRef.current = false;
            applyCamera();
          }, AUTO_FOCUS_MS);
        };
        const el = containerRef.current;
        el.addEventListener('pointerdown', onInteract, { passive: true });
        el.addEventListener('wheel', onInteract, { passive: true });

        setReady(true);
      })
      .catch((e) => {
        console.warn('[CourierMap] v3 yuklanmadi — v2.1 fallback:', e);
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (interactTimerRef.current) window.clearTimeout(interactTimerRef.current);
      try { mapRef.current?.destroy?.(); } catch { /* noop */ }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ⚠️ KOMPAS EFFEKTI — ISHLAYDI, O'ZGARTIRMA (yuqoridagi blokka qara).
  // Qurilma kompasi (DeviceOrientation) → heading → xarita aylanishi (turganda ham).
  useEffect(() => {
    if (!ready) return;
    const stop = startCompass((h) => {
      lastCompassAtRef.current = Date.now(); // kompas tirik — GPS bearing'ni bosadi
      setHeading(h);
      applyCamera();
    });
    return stop;
  }, [ready, setHeading, applyCamera]);

  // ── GPS → marker + tezlik + course-up follow ───────────────────────────────
  // ⚠️ heading + applyCamera qismi yuqoridagi qulflangan blokка tegishli.
  useEffect(() => {
    if (!ready) return;
    const watcher = new GpsWatcher();
    const apply = (tick: GpsTick) => {
      const { lng, lat, headingDeg, speedKmh: sp } = tick;
      const prev = posRef.current;
      posRef.current = [lng, lat];
      setInternalCourier({ lat, lng });
      setSpeedKmh(sp != null && sp >= 0 ? sp : null);
      courierMarkerRef.current?.update?.({ coordinates: [lng, lat] });
      setRemainingM(haversine([lng, lat], [routeTo.lng, routeTo.lat]));
      onGpsTick?.(tick);

      // Heading: KOMPAS birlamchi (device qayoqqa qarasa — o'sha tomon). Kompas tirik
      // bo'lsa GPS'ni e'tiborsiz qoldiramiz (turganda GPS shovqini SPIN qilmasin).
      // Kompas yo'q/eski bo'lsagina — GPS course/bearing, FAQAT harakatda.
      const compassStale = Date.now() - lastCompassAtRef.current > 2500;
      if (compassStale) {
        if (headingDeg != null && !Number.isNaN(headingDeg)) setHeading(headingDeg);
        else if (prev && (sp ?? 0) >= MIN_SPEED_BEARING_KMH) {
          const m = haversine(prev, [lng, lat]);
          if (m >= MOVE_BEARING_MIN_M) setHeading(bearing(prev, [lng, lat]));
        }
      }

      applyCamera(); // pozitsiya follow (aylanish applyCamera ichida threshold bilan)
    };

    watcher.start({
      onTick: (t: GpsTick) => apply(t),
      onError: () => { /* GPS yo'q — props.courier yoki pickup'da qolamiz */ },
    } as Parameters<GpsWatcher['start']>[0]);

    if (courierProp) {
      setInternalCourier(courierProp);
      setRemainingM(haversine([courierProp.lng, courierProp.lat], [routeTo.lng, routeTo.lat]));
    }

    return () => watcher.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, routeTo.lat, routeTo.lng, setHeading, applyCamera]);

  // ── Route fetch (courier pozitsiyasidan) + FAOL xarita qatlamlari ──────────
  useEffect(() => {
    if (!ready || !ymapsRef.current || !mapRef.current) return;
    const c = courier ?? { lat: posRef.current[1], lng: posRef.current[0] };
    if (haversine([c.lng, c.lat], [routeTo.lng, routeTo.lat]) < 12) return; // ≈yetib keldi
    // Throttle: routeTo + ~100m grid courier — ORS kvota
    const key = `${routeTo.lat.toFixed(4)},${routeTo.lng.toFixed(4)}|${c.lat.toFixed(3)},${c.lng.toFixed(3)}`;
    if (key === routeReqRef.current) return;
    routeReqRef.current = key;

    let cancelled = false;
    fetchRoute({ lat: c.lat, lng: c.lng }, routeTo, vehicleMode, null)
      .then((r: RouteResult | null) => {
        if (cancelled || !r || !mapRef.current) return;
        setRoute(r);
        if (typeof r.totalDistanceMeters === 'number' && initialTotalRef.current == null) {
          initialTotalRef.current = r.totalDistanceMeters;
        }
        const { YMapFeature, YMapMarker } = ymapsRef.current as any;
        const coords: [number, number][] = r.segments.flatMap((s) => s.coords);
        if (coords.length < 2) return;
        if (routeFeatureRef.current) {
          try { mapRef.current.removeChild(routeFeatureRef.current); } catch { /* noop */ }
        }
        const feature = new YMapFeature({
          geometry: { type: 'LineString', coordinates: coords },
          style: {
            stroke: [
              { color: 'rgba(0,0,0,0.5)', width: 12 },        // tashqi soya (kontrast)
              { color: '#3CC84B', width: 7.5 },               // Yandex-Navigator YASHIL
              { color: 'rgba(255,255,255,0.4)', width: 2 },   // nozik highlight
            ],
          },
        });
        mapRef.current.addChild(feature);
        routeFeatureRef.current = feature;

        // ── FAOL XARITA: connector (turgan joy → yo'lga chiqish) — ko'k punktir ─
        try {
          if (connectorFeatureRef.current) {
            try { mapRef.current.removeChild(connectorFeatureRef.current); } catch { /* noop */ }
            connectorFeatureRef.current = null;
          }
          const startPt = coords[0];
          const cpos: [number, number] = [c.lng, c.lat];
          if (startPt && haversine(cpos, startPt) > 8) {
            const conn = new YMapFeature({
              geometry: { type: 'LineString', coordinates: [cpos, startPt] },
              style: { stroke: [{ color: '#3B82F6', width: 5, dash: [7, 7] }] },
            });
            mapRef.current.addChild(conn);
            connectorFeatureRef.current = conn;
          }
        } catch { /* connector best-effort */ }

        // ── FAOL XARITA: OXIRGI QADAM (yo'l tugaydi → aniq eshik) — yashil punktir
        // ORS yo'lni yaqin yo'lga yopishtiradi; oxirgi metrlar piyoda → eshikkacha.
        try {
          if (endConnectorRef.current) {
            try { mapRef.current.removeChild(endConnectorRef.current); } catch { /* noop */ }
            endConnectorRef.current = null;
          }
          const endPt = coords[coords.length - 1];
          const dest: [number, number] = [routeTo.lng, routeTo.lat];
          if (endPt && haversine(endPt, dest) > 8) {
            const ec = new YMapFeature({
              geometry: { type: 'LineString', coordinates: [endPt, dest] },
              style: { stroke: [{ color: '#22C55E', width: 5, dash: [7, 7] }] },
            });
            mapRef.current.addChild(ec);
            endConnectorRef.current = ec;
          }
        } catch { /* end-connector best-effort */ }

        // ── FAOL XARITA: burilish OQ STRELKALARI (harakat yo'nalishiga aylanadi) ─
        // Course-up xaritada to'g'ri turishi uchun har strelka world-bearing − map-heading
        // ga aylantiriladi (applyCamera ichida yangilanadi).
        try {
          for (const a of maneuverMarkersRef.current) {
            try { mapRef.current.removeChild(a.marker); } catch { /* noop */ }
          }
          maneuverMarkersRef.current = [];
          const headingNow = smoothedHeadingRef.current;
          const mans = r.maneuvers.slice(0, 12);
          mans.forEach((m) => {
            const mc: [number, number] = [m.coords[0], m.coords[1]];
            const bdeg = bearingAlongRoute(coords, mc); // world yo'nalish
            const outer = document.createElement('div');
            outer.style.cssText = 'width:16px;height:62px;';
            const inner = document.createElement('div');
            // transition/filter YO'Q (lag manbai edi) — transform = kompozit, arzon.
            inner.style.cssText = `width:16px;height:62px;transform-origin:center;transform:rotate(${(bdeg - headingNow).toFixed(1)}deg);`;
            inner.innerHTML = turnArrowSvg();
            outer.appendChild(inner);
            const marker = new YMapMarker({ coordinates: mc, anchor: [0.5, 0.5], zIndex: 175 }, outer);
            mapRef.current.addChild(marker);
            maneuverMarkersRef.current.push({ marker, el: inner, bearingDeg: bdeg });
          });
        } catch { /* burilish strelkalari best-effort */ }
      })
      .catch(() => { routeReqRef.current = ''; /* keyingi tick qayta urinadi */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, routeTo.lat, routeTo.lng, vehicleMode, courier?.lat, courier?.lng]);

  // ── Keyingi burilish (maneuver) — banner uchun (ovoz YO'Q) ─────────────────
  useEffect(() => {
    if (!route || !courier) { setNextManeuver(null); setManeuverDist(null); return; }
    let best: { m: RouteManeuver; d: number } | null = null;
    for (const m of route.maneuvers) {
      const d = haversine([courier.lng, courier.lat], [m.coords[0], m.coords[1]]);
      if (!best || d < best.d) best = { m, d };
    }
    setNextManeuver(best?.m ?? null);
    setManeuverDist(best ? Math.round(best.d) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, courier?.lat, courier?.lng]);

  // v3 ishlamasa — ishlaydigan v2.1 navigatorga qaytamiz (launch xavfsiz)
  if (failed) return <DeliveryNavigator {...props} orderNumber={orderNumber != null ? String(orderNumber) : undefined} />;

  const ManeuverIcon = nextManeuver ? maneuverIcon(nextManeuver.type) : null;
  const maneuverText = nextManeuver ? (nextManeuver.instruction?.trim() || 'Davom eting') : null;

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
