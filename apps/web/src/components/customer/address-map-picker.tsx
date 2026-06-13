'use client';

/**
 * AddressMapPicker — mijoz manzil tanlash uchun mukammal Yandex xarita.
 *
 * XUSUSIYATLAR:
 *  1. Full-screen sheet — header'dagi qidiruv + markazda floating pin + pastda confirm panel
 *  2. Map markazi = tanlangan nuqta (foydalanuvchi xaritani sudraydi, pin doim markazda)
 *  3. Map idle bo'lganda (actionend) — reverse geocode → manzil avtomatik to'ldiriladi
 *  4. Qidiruv: typing → Yandex geocode → suggestions ro'yxati → tap → fly to location
 *  5. "Mening joylashuvim" tugma (crosshair) — GPS → setCenter
 *  6. Confirm tugmasi → onConfirm({ lat, lng, address }) → parent forma to'ldiriladi
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Crosshair, Loader2, MapPin, Search, X } from 'lucide-react';
import {
  getCurrentLocation,
  loadYandexMaps,
  RESTAURANT_DEFAULT,
  type LatLng,
  type Ymaps,
  type YmapInstance,
} from '@/lib/yandex-maps';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  coords: LatLng;
}

interface AddressMapPickerProps {
  initial?: LatLng | null;
  onConfirm: (result: { lat: number; lng: number; address: string }) => void;
  onClose: () => void;
}

export function AddressMapPicker({ initial, onConfirm, onClose }: AddressMapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<YmapInstance | null>(null);
  const ymapsRef = useRef<Ymaps | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [center, setCenter] = useState<LatLng | null>(initial ?? null);
  const [address, setAddress] = useState<string>('');
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [locating, setLocating] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const reverseTimerRef = useRef<number | null>(null);
  const searchTimerRef = useRef<number | null>(null);

  // ── Initial location (GPS yoki Toshkent default) ─────────────────────
  useEffect(() => {
    if (initial) {
      setCenter(initial);
      return;
    }
    void getCurrentLocation()
      .then((pos) => setCenter(pos))
      .catch(() => setCenter(RESTAURANT_DEFAULT));
  }, [initial]);

  // ── Mount map ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!center) return;
    let cancelled = false;

    loadYandexMaps()
      .then((ymaps) => {
        if (cancelled || !containerRef.current) return;
        ymapsRef.current = ymaps;

        const map = new ymaps.Map(
          containerRef.current,
          {
            center: [center.lat, center.lng],
            zoom: 17,
            controls: [],
          },
          { suppressMapOpenBlock: true, yandexMapDisablePoiInteractivity: true },
        );
        mapRef.current = map;

        const onActionEnd = () => {
          const m = mapRef.current as YmapInstance & { getCenter?: () => number[] };
          const newCenter = m?.getCenter?.();
          if (!newCenter || newCenter.length < 2) return;
          const c: LatLng = { lat: newCenter[0], lng: newCenter[1] };
          setCenter(c);

          // Debounced reverse geocode
          if (reverseTimerRef.current != null) {
            window.clearTimeout(reverseTimerRef.current);
          }
          setResolvingAddress(true);
          reverseTimerRef.current = window.setTimeout(() => {
            if (!ymaps.geocode) {
              setResolvingAddress(false);
              return;
            }
            (ymaps.geocode([c.lat, c.lng], { kind: 'house', results: 1 }) as Promise<{
              geoObjects: {
                get: (i: number) => {
                  getAddressLine?: () => string;
                  properties?: { get?: (k: string) => string };
                } | null;
              };
            }>)
              .then((result) => {
                const obj = result.geoObjects.get(0);
                const text = obj?.getAddressLine?.() ?? obj?.properties?.get?.('text') ?? '';
                setAddress(text);
              })
              .catch(() => setAddress(''))
              .finally(() => setResolvingAddress(false));
          }, 350);
        };

        map.events.add('actionend', onActionEnd);

        // Initial reverse geocode (avval pin qaerda turibti)
        window.setTimeout(onActionEnd, 0);

        setMapReady(true);
      })
      .catch(() => {
        setMapReady(false);
      });

    return () => {
      cancelled = true;
      if (reverseTimerRef.current != null) window.clearTimeout(reverseTimerRef.current);
      try { mapRef.current?.destroy(); } catch {/* */}
      mapRef.current = null;
      ymapsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center != null]);

  // ── Search (Yandex geocode) ──────────────────────────────────────────
  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchTimerRef.current != null) window.clearTimeout(searchTimerRef.current);
    if (q.trim().length < 3) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimerRef.current = window.setTimeout(async () => {
      try {
        const ymaps = ymapsRef.current;
        if (!ymaps?.geocode) return;
        const result = (await ymaps.geocode(q, { results: 5 })) as {
          geoObjects: {
            getLength: () => number;
            get: (i: number) => {
              geometry?: { getCoordinates?: () => number[] };
              getAddressLine?: () => string;
              properties?: { get?: (k: string) => string };
            } | null;
          };
        };
        const list: SearchResult[] = [];
        for (let i = 0; i < result.geoObjects.getLength(); i++) {
          const obj = result.geoObjects.get(i);
          const coords = obj?.geometry?.getCoordinates?.();
          if (!coords || coords.length < 2) continue;
          const title = obj?.getAddressLine?.() ?? '';
          if (!title) continue;
          list.push({
            id: `${coords[0]}_${coords[1]}_${i}`,
            title,
            subtitle: obj?.properties?.get?.('description'),
            coords: { lat: coords[0], lng: coords[1] },
          });
        }
        setSuggestions(list);
      } catch {/* swallow */} finally {
        setSearching(false);
      }
    }, 350);
  }, []);

  const selectSuggestion = useCallback((s: SearchResult) => {
    if (!mapRef.current) return;
    setSearchQuery('');
    setSuggestions([]);
    setSearchOpen(false);
    void mapRef.current.setCenter([s.coords.lat, s.coords.lng], 17, { duration: 500 });
  }, []);

  // ── My location button ───────────────────────────────────────────────
  const handleMyLocation = useCallback(async () => {
    setLocating(true);
    try {
      const pos = await getCurrentLocation();
      if (mapRef.current) {
        void mapRef.current.setCenter([pos.lat, pos.lng], 17, { duration: 500 });
      }
      try {
        const tg = (window as Window & { Telegram?: { WebApp?: { HapticFeedback?: { notificationOccurred?: (s: string) => void } } } })
          .Telegram?.WebApp?.HapticFeedback;
        tg?.notificationOccurred?.('success');
      } catch {/* */}
    } catch {/* user dismissed permission */} finally {
      setLocating(false);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (!center || !address) return;
    onConfirm({ lat: center.lat, lng: center.lng, address });
  }, [center, address, onConfirm]);

  return (
    <div className="fixed inset-0 z-[80] bg-slate-100" data-no-ptr="true">
      <div ref={containerRef} className="absolute inset-0" />

      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <Loader2 size={28} className="animate-spin text-[#c62020]" />
        </div>
      )}

      {/* Floating center pin — har doim markazda */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
        <div className="flex flex-col items-center" style={{ transform: 'translateY(8px)' }}>
          <svg width="40" height="48" viewBox="0 0 36 44">
            <defs>
              <linearGradient id="pickerPinGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#c62020" />
              </linearGradient>
              <filter id="pickerPinShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.4)" />
              </filter>
            </defs>
            <path
              d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z"
              fill="url(#pickerPinGrad)"
              stroke="#fff"
              strokeWidth="2.5"
              filter="url(#pickerPinShadow)"
            />
            <circle cx="18" cy="18" r="6" fill="#fff" />
          </svg>
          <div className="-mt-1 h-1.5 w-3 rounded-full bg-black/30 blur-sm" />
        </div>
      </div>

      {/* Top — search */}
      <div
        className="absolute inset-x-0 top-0 z-20 mx-auto w-full max-w-[480px] px-4 pt-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-lg active:scale-95"
            aria-label="Yopish"
          >
            <X size={18} />
          </button>
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Manzil yoki ko'cha qidiring..."
              className="w-full rounded-2xl border-0 bg-white py-3 pl-10 pr-10 text-sm font-medium text-slate-900 shadow-lg outline-none placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSuggestions([]); }}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                aria-label="Tozalash"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Suggestions dropdown */}
        {searchOpen && (suggestions.length > 0 || searching) && (
          <div className="mt-2 max-h-72 overflow-y-auto rounded-2xl bg-white shadow-xl">
            {searching && (
              <div className="flex items-center gap-2 px-4 py-3 text-xs text-slate-400">
                <Loader2 size={12} className="animate-spin" /> Qidirilmoqda...
              </div>
            )}
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => selectSuggestion(s)}
                className="flex w-full items-start gap-2.5 border-b border-slate-100 px-4 py-3 text-left transition active:bg-slate-50 last:border-0"
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-bold text-slate-900">{s.title}</p>
                  {s.subtitle && (
                    <p className="line-clamp-1 text-[11px] text-slate-500">{s.subtitle}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* My location button */}
      <button
        type="button"
        onClick={handleMyLocation}
        disabled={locating}
        className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-700 shadow-xl active:scale-95 disabled:opacity-60"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 200px)' }}
        aria-label="Mening joylashuvim"
      >
        {locating ? <Loader2 size={18} className="animate-spin" /> : <Crosshair size={18} />}
      </button>

      {/* Bottom panel — tanlangan manzil + confirm */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[480px] rounded-t-3xl bg-white shadow-[0_-20px_50px_-8px_rgba(0,0,0,0.35)]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        <div className="mx-auto mt-2.5 h-1 w-12 rounded-full bg-slate-200" />
        <div className="px-5 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Tanlangan manzil
          </p>
          <div className="mt-1.5 flex min-h-[40px] items-start gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-[#c62020]" />
            <p className="text-sm font-bold leading-snug text-slate-900">
              {resolvingAddress ? (
                <span className="inline-flex items-center gap-1.5 text-slate-400">
                  <Loader2 size={12} className="animate-spin" /> Aniqlanmoqda...
                </span>
              ) : address ? (
                address
              ) : (
                <span className="text-slate-400">Xaritani sudrang yoki qidiring</span>
              )}
            </p>
          </div>
          {center && (
            <p className="mt-1 ml-6 text-[10px] text-slate-400 tabular-nums">
              {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
            </p>
          )}
          <button
            type="button"
            disabled={!address || resolvingAddress}
            onClick={handleConfirm}
            className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#c62020] to-[#f97316] text-base font-black text-white shadow-[0_12px_24px_-8px_rgba(198,32,32,0.55)] active:scale-[0.98] disabled:opacity-50"
          >
            <Check size={18} strokeWidth={2.6} /> Bu manzilni tanlash
          </button>
        </div>
      </div>
    </div>
  );
}
