'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, X, Check, Loader2, Crosshair } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Yandex client kaliti — public (eski miniapp bundle'ida ham ochiq).
// Env bo'lmasa default ishlatiladi, shu sabab Vercel sozlamasiz ham xarita ochiladi.
const API_KEY =
  process.env.NEXT_PUBLIC_MAP_API_KEY || 'c3e2b675-cbbf-4886-b77a-3ed4e0d4f3f8';
const LANG = process.env.NEXT_PUBLIC_MAP_LANGUAGE || 'uz_UZ';

function ym(): any {
  return (window as any).ymaps;
}

let ymapsPromise: Promise<any> | null = null;
function loadYmaps(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject();
  if (ym()?.ready) return new Promise((r) => ym().ready(() => r(ym())));
  if (!ymapsPromise) {
    ymapsPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `https://api-maps.yandex.ru/2.1/?apikey=${API_KEY}&lang=${LANG}`;
      s.onload = () => ym().ready(() => resolve(ym()));
      s.onerror = () => reject(new Error('Xarita yuklanmadi'));
      document.head.appendChild(s);
    });
  }
  return ymapsPromise;
}

interface Props {
  initial: { lat: number; lng: number };
  onCancel: () => void;
  onConfirm: (lat: number, lng: number, address: string) => void;
}

export function MapLocationPicker({ initial, onCancel, onConfirm }: Props) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [moving, setMoving] = useState(false);
  const [center, setCenter] = useState<[number, number]>([initial.lat, initial.lng]);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function reverseGeocode(ymaps: any, coords: [number, number]) {
    try {
      const res = await ymaps.geocode(coords);
      const obj = res.geoObjects.get(0);
      setAddress(obj?.getAddressLine?.() ?? '');
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (!API_KEY) {
      setError('NEXT_PUBLIC_MAP_API_KEY sozlanmagan');
      setLoading(false);
      return;
    }
    let map: any;
    loadYmaps()
      .then((ymaps) => {
        if (!mapEl.current) return;
        map = new ymaps.Map(mapEl.current, {
          center: [initial.lat, initial.lng],
          zoom: 16,
          controls: ['zoomControl', 'geolocationControl'],
        });
        mapRef.current = map;
        setLoading(false);
        void reverseGeocode(ymaps, [initial.lat, initial.lng]);

        // actionbegin/actionend — to'xtagan zahoti pin tushadi va saqlash yoqiladi
        // (boundschange + 350ms debounce sekin edi). Geocode fonда — saqlashни kutdirmaydi.
        const onStart = () => setMoving(true);
        const onEnd = () => {
          setMoving(false);
          const c = map.getCenter() as [number, number];
          setCenter(c); // koordinata DARHOL → saqlash shu zahoti
          void reverseGeocode(ymaps, c); // manzil matni fonда keladi
        };
        map.events.add('actionbegin', onStart);
        map.events.add('actionend', onEnd);
      })
      .catch(() => {
        setError('Xaritani yuklab bo\'lmadi');
        setLoading(false);
      });

    return () => {
      if (moveTimer.current) clearTimeout(moveTimer.current);
      try { map?.destroy(); } catch { /* */ }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 text-white" style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 12px)' }}>
        <span className="text-sm font-bold">Restoran joylashuvi</span>
        <button type="button" onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"><X size={18} /></button>
      </div>

      {/* Map */}
      <div className="relative flex-1">
        <div ref={mapEl} className="absolute inset-0" />

        {(loading || error) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900 text-white/70">
            {error ? <><MapPin size={28} /><p className="px-8 text-center text-sm">{error}</p></> : <Loader2 size={28} className="animate-spin" />}
          </div>
        )}

        {/* Markaziy lollipop pin — harakatda ko'tariladi (soya kichrayadi), to'xtaganda tushadi */}
        {!loading && !error && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10">
            {/* yerdagi soya (aniq nuqta) */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/45 blur-[2px] transition-all duration-200 ease-out"
              style={{ width: moving ? 8 : 16, height: moving ? 3 : 5, opacity: moving ? 0.3 : 0.5 }}
            />
            {/* bosh + dasta (uchи markazda) */}
            <div
              className="absolute bottom-0 flex flex-col items-center transition-transform duration-200 ease-out"
              style={{ transform: `translate(-50%, ${moving ? '-13px' : '-2px'})` }}
            >
              <div className="h-6 w-6 rounded-full border-[3px] border-white bg-gradient-to-br from-[#f97316] to-[#c62020] shadow-[0_4px_10px_rgba(198,32,32,0.5)]" />
              <div className="-mt-0.5 h-3 w-[3px] rounded-full bg-[#c62020]" />
            </div>
          </div>
        )}
      </div>

      {/* Pastki panel — to'xtaganda save */}
      <div className="space-y-3 rounded-t-3xl bg-white p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 16px)' }}>
        <div className="flex items-start gap-2">
          <Crosshair size={16} className="mt-0.5 shrink-0 text-ember" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{moving ? 'Joyni tanlang...' : (address || 'Manzil aniqlanmoqda...')}</p>
            <p className="admin-num mt-0.5 text-[11px] text-slate-400">{center[0].toFixed(5)}, {center[1].toFixed(5)}</p>
          </div>
        </div>
        <button
          type="button"
          disabled={moving || loading || !!error}
          onClick={() => onConfirm(center[0], center[1], address)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-ember to-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-ember/30 transition active:scale-[0.99] disabled:opacity-50"
        >
          <Check size={16} /> Shu joyni saqlash
        </button>
      </div>
    </div>
  );
}
