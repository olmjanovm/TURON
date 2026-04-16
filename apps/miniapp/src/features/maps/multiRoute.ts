/**
 * Multi-route navigation utility
 * Fetches alternative routes from Yandex Maps API and formats them for display
 */

export interface RouteAlternative {
  id: string;
  instruction: string;
  distance: string;
  eta: string;
  isRecommended?: boolean;
  routeIndex: number;
  coordinates: Array<[number, number]>;
  steps: Array<{
    instruction: string;
    distanceMeters: number;
  }>;
}

export interface NavigationStep {
  instruction: string;
  distanceMeters: number;
  distanceText: string;
}

/**
 * Fetch multiple route alternatives from Yandex Maps API
 * Returns up to 3 different routes
 */
export async function fetchRouteAlternatives(
  ymaps3: any,
  from: [number, number],
  to: [number, number],
): Promise<RouteAlternative[]> {
  if (!ymaps3 || !from || !to) return [];

  try {
    const result = await ymaps3.route({
      points: [
        { type: 'coordinates', coordinates: from },
        { type: 'coordinates', coordinates: to },
      ],
      type: 'driving',
      // Yandex API may support requesting multiple routes
      // Default behavior returns primary route
    });

    const routes = result?.routes ?? [];
    if (routes.length === 0) return [];

    return routes.slice(0, 3).map((route: any, index: number) => {
      const dM = route.properties?.distance?.value ?? route.distance?.value ?? 0;
      const dS = route.properties?.duration?.value ?? route.duration?.value ?? 0;

      const km = dM / 1000;
      const distText = km < 1 ? `${Math.round(dM)} m` : `${km.toFixed(1)} km`;
      const etaText = `${Math.ceil(dS / 60)} daq`;

      // Extract first instruction
      const steps = route.legs?.[0]?.steps ?? route.properties?.legs?.[0]?.steps ?? [];
      let mainInstruction = `Yo'l ${index + 1}`;

      if (steps.length > 0) {
        const step = steps[0];
        mainInstruction =
          step.properties?.instruction ??
          step.instruction ??
          step.properties?.text ??
          `Yo'l ${index + 1}`;
      }

      // Extract all step instructions
      const allSteps: Array<{ instruction: string; distanceMeters: number }> = steps.map(
        (step: any) => ({
          instruction:
            step.properties?.instruction ??
            step.instruction ??
            step.properties?.text ??
            'Navbatdagi bosqich',
          distanceMeters: step.properties?.distance?.value ?? step.distance?.value ?? 0,
        }),
      );

      // Get coordinates
      const geomCoords = route.geometry?.coordinates ?? [];
      let coords: Array<[number, number]> = [];
      if (route.geometry?.type === 'MultiLineString') {
        coords = (geomCoords as number[][][]).flat(1) as [number, number][];
      } else {
        coords = geomCoords as [number, number][];
      }

      return {
        id: `route-${index}`,
        instruction: mainInstruction,
        distance: distText,
        eta: etaText,
        isRecommended: index === 0,
        routeIndex: index,
        coordinates: coords,
        steps: allSteps,
      };
    });
  } catch (err) {
    console.warn('[RouteAlternatives] Fetch failed:', err);
    return [];
  }
}

/**
 * Extract turn-by-turn navigation steps from a route
 */
export function extractNavigationSteps(route: any): NavigationStep[] {
  const steps = route.legs?.[0]?.steps ?? route.properties?.legs?.[0]?.steps ?? [];

  return steps.map((step: any) => ({
    instruction:
      step.properties?.instruction ??
      step.instruction ??
      step.properties?.text ??
      'Navbatdagi bosqich',
    distanceMeters: step.properties?.distance?.value ?? step.distance?.value ?? 0,
    distanceText: formatDistance(step.properties?.distance?.value ?? step.distance?.value ?? 0),
  }));
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Get current step index based on courier position and route
 */
export function getCurrentStepIndex(
  courierPosition: { lat: number; lng: number },
  steps: NavigationStep[],
): number {
  // Simple implementation: return next step that is far enough away
  // In production, you'd want to track courier progress along the route polyline
  return 0;
}

/**
 * Convert route coordinates to GeoJSON LineString for rendering
 */
export function routeToGeoJSON(coordinates: Array<[number, number]>) {
  return {
    type: 'LineString' as const,
    coordinates,
  };
}
