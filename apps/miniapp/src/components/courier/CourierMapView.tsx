import React from 'react';
import type { RouteMapProps } from '../../features/maps/MapProvider';
import { getMapProvider } from '../../features/maps/provider';

export function CourierMapView(props: RouteMapProps) {
  const mapProvider = getMapProvider();
  const RouteMap = mapProvider.RouteMap;

  return <RouteMap {...props} />;
}
