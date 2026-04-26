import React from 'react';
import { Loader2, MapPinned, TriangleAlert } from 'lucide-react';
import { loadYandexMaps, reverseGeocodeCoordinates } from '../../../features/maps/yandex';

interface Props {
  latitude: number;
  longitude: number;
  addressText: string;
  onLocationChange: (payload: { latitude: number; longitude: number; addressText?: string }) => void;
}

export function RestaurantAddressMap({ latitude, longitude, addressText, onLocationChange }: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<ymaps.Map | null>(null);
  const locationChangeRef = React.useRef(onLocationChange);
  const addressRef = React.useRef(addressText);
  const lastCenterRef = React.useRef<[number, number]>([latitude, longitude]);
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    locationChangeRef.current = onLocationChange;
    addressRef.current = addressText;
  }, [addressText, onLocationChange]);

  React.useEffect(() => {
    let destroyed = false;

    const initMap = async () => {
      if (!containerRef.current) return;
      try {
        const maps = await loadYandexMaps();
        if (destroyed || !containerRef.current) return;

        const center: [number, number] = [latitude, longitude];
        lastCenterRef.current = center;

        const map = new maps.Map(containerRef.current, {
          center,
          zoom: 17,
          type: 'yandex#map',
          controls: ['zoomControl'],
        });

        map.events.add('actionbegin', () => {
          if (!destroyed) setIsDragging(true);
        });

        map.events.add('actionend', async () => {
          if (destroyed) return;
          setIsDragging(false);

          const rawCenter = map.getCenter() as number[];
          const lat = rawCenter[0] as number;
          const lng = rawCenter[1] as number;

          // Skip geocoding if center hasn't moved meaningfully
          const prev = lastCenterRef.current;
          const moved = Math.hypot(lat - prev[0], lng - prev[1]);
          if (moved < 0.000_01) return;

          lastCenterRef.current = [lat, lng];
          const resolvedAddress = await reverseGeocodeCoordinates({ lat, lng });
          locationChangeRef.current({
            latitude: lat,
            longitude: lng,
            addressText: resolvedAddress || addressRef.current,
          });
        });

        mapRef.current = map;
        setStatus('ready');
      } catch {
        if (!destroyed) setStatus('error');
      }
    };

    void initMap();
    return () => {
      destroyed = true;
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, []);

  // Sync external coordinate changes (e.g. from address search) to map center
  React.useEffect(() => {
    if (!mapRef.current) return;
    const nextCenter: [number, number] = [latitude, longitude];
    lastCenterRef.current = nextCenter;
    void (mapRef.current as any).setCenter(nextCenter, 17, { duration: 280, flying: true });
  }, [latitude, longitude]);

  return (
    <div className="adminx-map-shell adminx-restaurant-map-shell">
      {status === 'loading' ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <Loader2 size={22} className="animate-spin text-[var(--adminx-color-primary-dark)]" />
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="flex h-[288px] items-center justify-center gap-3 text-[var(--adminx-color-muted)]">
          <TriangleAlert size={18} />
          <span className="text-sm font-bold">Xarita yuklanmadi</span>
        </div>
      ) : (
        <>
          <div ref={containerRef} className="adminx-map-canvas adminx-restaurant-map-canvas" />

          {/* Fixed center-pin overlay — never moves with the map */}
          <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
            {/* Ground shadow stays at the anchor point, expands when lifted */}
            <div className="absolute left-1/2 top-1/2">
              <div className={`adminx-pin-ground-shadow${isDragging ? ' adminx-pin-ground-shadow--active' : ''}`} />
            </div>

            {/* Pin head + stem — tip points at anchor point, lifts on drag */}
            <div className="absolute left-1/2 top-1/2">
              <div className={`adminx-center-pin${isDragging ? ' adminx-center-pin--lifted' : ''}`}>
                <div className="adminx-center-pin-head" />
                <div className="adminx-center-pin-stem" />
              </div>
            </div>
          </div>
        </>
      )}

      <div className="adminx-map-floating adminx-restaurant-map-floating">
        <div className="adminx-map-note adminx-restaurant-map-note">
          <div className="flex items-center gap-2 text-[var(--adminx-color-primary-dark)]">
            <MapPinned size={14} />
            <span className="adminx-kicker">Tanlangan manzil</span>
          </div>
          <p className="mt-1.5 text-[13px] font-semibold leading-5 text-[var(--adminx-color-ink)]">{addressText}</p>
          <p className="mt-1 text-[11px] font-semibold text-[var(--adminx-color-faint)]">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        </div>
      </div>
    </div>
  );
}
