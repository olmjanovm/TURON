import { useQuery } from '@tanstack/react-query';
import type { MapPin } from '../../features/maps/MapProvider';
import { fetchDistanceMatrixEstimate, fetchRouteDetails } from '../../features/maps/api';

function buildMapKey(pin?: MapPin | null) {
  if (!pin) {
    return 'none';
  }

  return `${pin.lat.toFixed(6)}:${pin.lng.toFixed(6)}`;
}

export function useDistanceMatrixEstimate(
  origin?: MapPin | null,
  destination?: MapPin | null,
  enabled = true,
) {
  return useQuery({
    queryKey: ['maps', 'distance-matrix', buildMapKey(origin), buildMapKey(destination)],
    enabled: enabled && Boolean(origin && destination),
    queryFn: () => fetchDistanceMatrixEstimate(origin!, destination!),
    staleTime: 60_000,
  });
}

export function useRouteDetails(
  origin?: MapPin | null,
  destination?: MapPin | null,
  enabled = true,
) {
  return useQuery({
    queryKey: ['maps', 'route', buildMapKey(origin), buildMapKey(destination)],
    enabled: enabled && Boolean(origin && destination),
    queryFn: () => fetchRouteDetails(origin!, destination!),
    staleTime: 30_000,
  });
}
