import { RESTAURANT_COORDINATES } from '@turon/shared';
import type { MapPin } from './MapProvider';

export const DEFAULT_RESTAURANT_LOCATION: {
  id: string;
  name: string;
  pin: MapPin;
} = {
  id: 'main-restaurant',
  name: RESTAURANT_COORDINATES.name,
  pin: {
    lat: RESTAURANT_COORDINATES.lat,
    lng: RESTAURANT_COORDINATES.lng,
  },
};
