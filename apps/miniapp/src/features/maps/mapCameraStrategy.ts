/**
 * Smart camera positioning based on distance to destination
 * Automatically adjusts tilt, zoom, and viewing angle for optimal UX
 */

export interface CameraConfig {
  tilt: number;        // 0-60 degrees (0=overhead, 60=ground level)
  zoom: number;        // Zoom level (15-21)
  updateFreqMs: number; // GPS update frequency
}

export interface DistanceMetrics {
  distanceMeters: number;
  speedKmh?: number;
}

/**
 * Get optimal camera configuration based on distance
 * Closer = more tilted + zoomed in + more frequent updates
 */
export function getOptimalCameraConfig(metrics: DistanceMetrics): CameraConfig {
  const { distanceMeters, speedKmh = 0 } = metrics;

  // >1000m: Bird's eye view (overhead, wide angle)
  if (distanceMeters > 1000) {
    return {
      tilt: 0,        // Flat overhead
      zoom: 15,       // Wide view, see whole route
      updateFreqMs: 5000, // 5 sec (battery friendly)
    };
  }

  // 500-1000m: 3D isometric (balanced view)
  if (distanceMeters > 500) {
    return {
      tilt: 25,
      zoom: 16,
      updateFreqMs: 3000, // 3 sec
    };
  }

  // 200-500m: 3D closer (street level buildings visible)
  if (distanceMeters > 200) {
    return {
      tilt: 35,
      zoom: 17,
      updateFreqMs: 2000, // 2 sec
    };
  }

  // 50-200m: 3D tight (destination building prominent)
  if (distanceMeters > 50) {
    return {
      tilt: 40,
      zoom: 18,
      updateFreqMs: 1500, // 1.5 sec
    };
  }

  // 20-50m: Street level detail (almost there)
  if (distanceMeters > 20) {
    return {
      tilt: 45,
      zoom: 19,
      updateFreqMs: 1000, // 1 sec (critical)
    };
  }

  // <20m: Destination focused (POD ready)
  return {
    tilt: 50,
    zoom: 20,
    updateFreqMs: 500, // 0.5 sec (ultra-precise)
  };
}

/**
 * Smooth tilt/zoom transitions
 * Prevents jarring camera jumps
 */
export function shouldUpdateCamera(
  current: CameraConfig,
  target: CameraConfig,
  changeThreshold = 5, // degrees/zoom level
): boolean {
  const tiltDiff = Math.abs(current.tilt - target.tilt);
  const zoomDiff = Math.abs(current.zoom - target.zoom);
  return tiltDiff > changeThreshold || zoomDiff > changeThreshold;
}

/**
 * Smooth interpolation for camera transitions
 */
export function interpolateCamera(
  current: CameraConfig,
  target: CameraConfig,
  progress: number, // 0-1
): CameraConfig {
  return {
    tilt: current.tilt + (target.tilt - current.tilt) * progress,
    zoom: current.zoom + (target.zoom - current.zoom) * progress,
    updateFreqMs: Math.round(
      current.updateFreqMs + (target.updateFreqMs - current.updateFreqMs) * progress,
    ),
  };
}

/**
 * Get GPS update frequency based on battery level
 * Lower battery = less frequent updates
 */
export function getAdaptiveUpdateFrequency(
  baseFreqMs: number,
  batteryPercent: number,
): number {
  if (batteryPercent > 80) return baseFreqMs; // Normal
  if (batteryPercent > 40) return baseFreqMs * 1.5; // 50% slower
  if (batteryPercent > 20) return baseFreqMs * 2; // 2x slower
  return baseFreqMs * 3; // 3x slower when critical
}
