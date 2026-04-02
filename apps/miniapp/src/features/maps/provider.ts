import type { MapProvider } from './MapProvider';
import { MockMapProvider } from './providers/MockMapProvider';
import { YandexMapProvider } from './providers/YandexMapProvider';

const MAP_PROVIDER = import.meta.env.VITE_MAPS_PROVIDER ?? 'yandex';

export function getMapProvider(): MapProvider {
  if (MAP_PROVIDER === 'yandex' && YandexMapProvider.isEnabled) {
    return YandexMapProvider;
  }

  return MockMapProvider;
}
