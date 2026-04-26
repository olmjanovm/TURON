import React from 'react';
import { Loader2, MapPinned, TriangleAlert } from 'lucide-react';
import { loadYandexMaps, reverseGeocodeCoordinates } from '../../../features/maps/yandex';

interface Props {
  latitude: number;
  longitude: number;
  addressText: string;
  onLocationChange: (payload: { latitude: number; longitude: number; addressText?: string }) => void;
}

interface YandexPlacemarkController extends ymaps.Placemark {
  geometry: {
    getCoordinates: () => [number, number];
    setCoordinates: (coords: [number, number]) => void;
  };
}

interface YandexWithTemplateFactory {
  templateLayoutFactory: {
    createClass: (markup: string) => unknown;
  };
}

const PIN_MARKUP = `
  <div class="adminx-pin-bounce" style="transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;">
    <div style="width:24px;height:24px;border-radius:999px;background:#F5A623;border:2px solid #ffffff;box-shadow:0 10px 22px rgba(245,166,35,0.34);"></div>
    <div style="width:2px;height:20px;background:#1C1207;border-radius:999px;margin-top:-1px;"></div>
    <div style="width:10px;height:4px;border-radius:999px;background:rgba(28,18,7,0.18);margin-top:-1px;"></div>
  </div>
`;

export function RestaurantAddressMap({ latitude, longitude, addressText, onLocationChange }: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<ymaps.Map | null>(null);
  const markerRef = React.useRef<YandexPlacemarkController | null>(null);
  const locationChangeRef = React.useRef(onLocationChange);
  const addressRef = React.useRef(addressText);
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading');

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
        const withTemplate = maps as typeof maps & YandexWithTemplateFactory;
        const center: [number, number] = [latitude, longitude];
        const map = new maps.Map(containerRef.current, { center, zoom: 16, controls: ['zoomControl'] });
        const placemark = new maps.Placemark(center, {}, {
          draggable: true,
          iconLayout: withTemplate.templateLayoutFactory.createClass(PIN_MARKUP),
          iconShape: { type: 'Circle', coordinates: [12, 12], radius: 14 },
        }) as unknown as YandexPlacemarkController;

        placemark.events.add('dragend', async () => {
          const [lat, lng] = placemark.geometry.getCoordinates();
          const resolvedAddress = await reverseGeocodeCoordinates({ lat, lng });
          locationChangeRef.current({
            latitude: lat,
            longitude: lng,
            addressText: resolvedAddress || addressRef.current,
          });
        });

        map.geoObjects.add(placemark);
        mapRef.current = map;
        markerRef.current = placemark;
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
      markerRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const nextCenter: [number, number] = [latitude, longitude];
    markerRef.current?.geometry.setCoordinates(nextCenter);
    void mapRef.current?.setCenter(nextCenter, 16, { duration: 240, flying: true });
  }, [latitude, longitude]);

  return (
    <div className="adminx-map-shell">
      {status === 'loading' ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <Loader2 size={22} className="animate-spin text-[var(--adminx-color-primary-dark)]" />
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="flex h-[320px] items-center justify-center gap-3 text-[var(--adminx-color-muted)]">
          <TriangleAlert size={18} />
          <span className="text-sm font-bold">Xarita yuklanmadi</span>
        </div>
      ) : <div ref={containerRef} className="adminx-map-canvas" />}
      <div className="adminx-map-floating">
        <div className="adminx-map-note">
          <div className="flex items-center gap-2 text-[var(--adminx-color-primary-dark)]">
            <MapPinned size={15} />
            <span className="adminx-kicker">Tanlangan manzil</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-[var(--adminx-color-ink)]">{addressText}</p>
          <p className="mt-2 text-xs font-semibold text-[var(--adminx-color-faint)]">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        </div>
      </div>
    </div>
  );
}
