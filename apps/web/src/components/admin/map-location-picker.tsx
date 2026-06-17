'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, X, Check, Loader2, Crosshair } from 'lucide-react';
import { loadYandexMaps, reverseGeocode, type YmapInstance } from '@/lib/yandex-maps';
import { CenterPin } from '@/components/map/center-pin';

interface Props {
  initial: { lat: number; lng: number };
  onCancel: () => void;
  onConfirm: (lat: number, lng: number, address: string) => void;
}

/**
 * Admin restoran joylashuvini xaritadan belgilash.
 * Customer picker bilan BIR XIL: shared `@/lib/yandex-maps` loader (yagona
 * API kalit) + shared `CenterPin` (Yandex Go uslubidagi teardrop) +
 * timeout'li reverseGeocode ("Aniqlanmoqda" qotmaydi).
 */
export function MapLocationPicker({ initial, onCancel, onConfirm }: Props) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YmapInstance | null>(null);
  const geoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [moving, setMoving] = useState(false);
  const [center, setCenter] = useState<[number, number]>([initial.lat, initial.lng]);
  const [address, setAddress] = useState('');
  const [resolving, setResolving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounced + timeout'li reverse geocode — faqat manzil matni uchun (saqlashни bloklamaydi)
  function runGeocode(lat: number, lng: number) {
    if (geoTimer.current) clearTimeout(geoTimer.current);
    setResolving(true);
    geoTimer.current = setTimeout(() => {
      reverseGeocode({ lat, lng })
        .then((text) => setAddress(text ?? ''))
        .finally(() => setResolving(false));
    }, 180);
  }

  useEffect(() => {
    let map: YmapInstance | null = null;
    loadYandexMaps()
      .then((ymaps) => {
        if (!mapEl.current) return;
        map = new ymaps.Map(
          mapEl.current,
          { center: [initial.lat, initial.lng], zoom: 16, controls: ['zoomControl', 'geolocationControl'] },
          { suppressMapOpenBlock: true },
        );
        mapRef.current = map;
        setLoading(false);
        runGeocode(initial.lat, initial.lng);

        // actionbegin/actionend — to'xtagan zahoti pin tushadi va saqlash yoqiladi
        const onStart = () => setMoving(true);
        const onEnd = () => {
          setMoving(false);
          const m = mapRef.current as (YmapInstance & { getCenter?: () => number[] }) | null;
          const c = m?.getCenter?.();
          if (!c || c.length < 2) return;
          setCenter([c[0], c[1]]); // koordinata DARHOL → saqlash shu zahoti
          runGeocode(c[0], c[1]); // manzil matni fonда keladi
        };
        map.events.add('actionbegin', onStart);
        map.events.add('actionend', onEnd);
      })
      .catch(() => {
        setError("Xaritani yuklab bo'lmadi");
        setLoading(false);
      });

    return () => {
      if (geoTimer.current) clearTimeout(geoTimer.current);
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

        {/* Markaziy pin — Yandex Go uslubidagi teardrop (shared) */}
        {!loading && !error && <CenterPin moving={moving} />}
      </div>

      {/* Pastki panel — to'xtaganda save */}
      <div className="space-y-3 rounded-t-3xl bg-white p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 16px)' }}>
        <div className="flex items-start gap-2">
          <Crosshair size={16} className="mt-0.5 shrink-0 text-ember" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              {moving ? 'Joyni tanlang...' : resolving ? 'Manzil aniqlanmoqda...' : (address || 'Xaritani suring')}
            </p>
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
