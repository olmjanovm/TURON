import React, { Suspense } from 'react';
import type { LocationPickerProps, MapProvider, RouteMapProps } from '../MapProvider';
import { detectBrowserGeolocation, isBrowserGeolocationSupported } from '../geolocation';
import {
  formatCoordinateAddress,
  isYandexMapsEnabled,
  resolveCandidate,
  reverseGeocodeCoordinates,
  searchAddressCandidates,
} from '../yandex';

const YANDEX_FALLBACK_MESSAGE = 'Demo xarita ishlatilmoqda. Yandex uchun `VITE_MAP_API_KEY` ni sozlang.';
const LazyYandexLocationPicker = React.lazy(() => import('../components/YandexLocationPicker'));
const LazyYandexRouteMap = React.lazy(() => import('../components/YandexRouteMap'));

function MapShellFallback({
  height = '400px',
  className = '',
  label = 'Xarita tayyorlanmoqda...',
}: {
  height?: string;
  className?: string;
  label?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[40px] bg-slate-100 ${className}`} style={{ height }}>
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-lg">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-sm font-bold text-slate-700">{label}</span>
        </div>
      </div>
    </div>
  );
}

function YandexLocationPickerLoader(props: LocationPickerProps) {
  return (
    <Suspense fallback={<MapShellFallback height={props.height} className={props.className} />}>
      <LazyYandexLocationPicker {...props} />
    </Suspense>
  );
}

function YandexRouteMapLoader(props: RouteMapProps) {
  return (
    <Suspense
      fallback={
        <MapShellFallback
          height={props.height}
          className={props.className}
          label="Yo'nalish tayyorlanmoqda..."
        />
      }
    >
      <LazyYandexRouteMap {...props} />
    </Suspense>
  );
}

export const YandexMapProvider: MapProvider = {
  id: 'yandex',
  label: 'Yandex Maps',
  isEnabled: isYandexMapsEnabled(),
  supportsAddressSearch: isYandexMapsEnabled(),
  supportsRouting: isYandexMapsEnabled(),
  supportsGeolocation: isBrowserGeolocationSupported(),
  fallbackMessage: YANDEX_FALLBACK_MESSAGE,
  formatCoordinateAddress,
  detectUserLocation: detectBrowserGeolocation,
  reverseGeocode: reverseGeocodeCoordinates,
  searchAddresses: searchAddressCandidates,
  resolveAddressCandidate: resolveCandidate,
  LocationPicker: YandexLocationPickerLoader,
  RouteMap: YandexRouteMapLoader,
};
