/**
 * Advanced 3D courier tracking with heading-aware camera positioning
 * Camera trails behind courier, rotating based on movement direction
 * Courier triangle rotates to show heading direction
 */

export interface CourierHeadingState {
  heading: number;           // 0-360 degrees (0=north)
  lat: number;
  lng: number;
  speed?: number;
}

export interface AdvancedCameraConfig {
  // Camera position relative to courier (trailing behind)
  cameraHeadingOffset: number; // How far behind (0-180)
  tilt: number;              // 3D perspective (30-60 degrees)
  zoom: number;              // Map zoom level
  
  // Courier icon styling
  courierIconRotation: number; // Triangle rotation (0-360)
  courierIconScale: number;    // Size relative to distance
  courierIconColor: string;    // Color (red indicator for direction)
}

/**
 * Calculate optimal camera angle based on courier heading and distance
 * Camera stays behind courier, looking forward
 */
export function getAdvancedCameraConfig(
  courierState: CourierHeadingState,
  distanceToDestinationMeters: number,
): AdvancedCameraConfig {
  const { heading = 0, speed = 0 } = courierState;

  // Calculate camera positioning: always behind courier
  // If heading is 0 (north), camera should be south (180)
  const cameraHeadingOffset = (heading + 180) % 360;

  // Dynamic tilt based on distance
  let tilt: number;
  let zoom: number;
  let courierIconScale: number;

  if (distanceToDestinationMeters > 1000) {
    tilt = 35;  // Less tilted for overview
    zoom = 16;
    courierIconScale = 1;
  } else if (distanceToDestinationMeters > 500) {
    tilt = 40;  // More 3D for street level
    zoom = 17;
    courierIconScale = 1.2;
  } else if (distanceToDestinationMeters > 200) {
    tilt = 45;
    zoom = 18;
    courierIconScale = 1.4;
  } else if (distanceToDestinationMeters > 50) {
    tilt = 50;  // Heavy 3D perspective
    zoom = 19;
    courierIconScale = 1.6;
  } else {
    tilt = 55;  // Maximum 3D for POD
    zoom = 20;
    courierIconScale = 2;
  }

  return {
    cameraHeadingOffset,
    tilt,
    zoom,
    courierIconRotation: heading,  // Triangle points in heading direction
    courierIconScale,
    courierIconColor: '#EF4444',   // Red (#EF4444 for direction indicator)
  };
}

/**
 * Smooth camera transitions
 * Prevents jarring jumps when heading changes
 */
export function smoothHeadingTransition(
  currentHeading: number,
  targetHeading: number,
  maxChangePerFrame: number = 5, // degrees per 60ms
): number {
  let diff = targetHeading - currentHeading;

  // Handle wraparound (0-360)
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  // Clamp to max change
  if (Math.abs(diff) > maxChangePerFrame) {
    return currentHeading + (diff > 0 ? maxChangePerFrame : -maxChangePerFrame);
  }

  return targetHeading;
}

/**
 * Generate 3D courier triangle SVG
 * Points in direction of heading with red tip indicator
 * Note: SVG itself has NO rotation; rotation is applied by the container element
 */
export function create3DCourierIcon(
  heading: number,
  scale: number = 1,
  colorHex: string = '#EF4444',
): string {
  const size = 40 * scale;
  const viewSize = 40;

  // SVG path for 3D isometric triangle/pyramid
  // Pointing upward (heading 0) with red tip
  // NOTE: NO inline rotation here - rotation is applied via container CSS transform
  const svg = `
    <svg viewBox="0 0 ${viewSize} ${viewSize}" width="${size}" height="${size}" 
         xmlns="http://www.w3.org/2000/svg">
      <!-- Shadow/depth effect -->
      <ellipse cx="${viewSize / 2}" cy="${viewSize - 4}" rx="${viewSize * 0.35}" ry="${viewSize * 0.15}" 
               fill="rgba(0,0,0,0.15)" />
      
      <!-- 3D pyramid sides -->
      <!-- Left side (darker) -->
      <polygon points="${viewSize / 2},${viewSize * 0.1} ${viewSize * 0.2},${viewSize * 0.8} ${viewSize / 2},${viewSize * 0.75}"
               fill="#DC2626" opacity="0.7" />
      
      <!-- Right side (lighter) -->
      <polygon points="${viewSize / 2},${viewSize * 0.1} ${viewSize * 0.8},${viewSize * 0.8} ${viewSize / 2},${viewSize * 0.75}"
               fill="${colorHex}" opacity="1" />
      
      <!-- Top point (bright red - direction indicator) -->
      <polygon points="${viewSize / 2},${viewSize * 0.05} ${viewSize * 0.45},${viewSize * 0.25} ${viewSize * 0.55},${viewSize * 0.25}"
               fill="#FCA5A5" />
      
      <!-- Front face outline -->
      <path d="M ${viewSize / 2} ${viewSize * 0.1} L ${viewSize * 0.2} ${viewSize * 0.8} L ${viewSize * 0.8} ${viewSize * 0.8} Z"
            stroke="${colorHex}" stroke-width="1" fill="none" opacity="0.5" />
    </svg>
  `;

  return svg;
}

/**
 * Calculate camera position in 3D space
 * Camera positioned behind and above courier
 */
export function calculateCameraPosition(
  courierLat: number,
  courierLng: number,
  heading: number,
  distanceBehindMeters: number = 50,
): { lat: number; lng: number } {
  // Convert heading to radians
  const headingRad = (heading * Math.PI) / 180;

  // Calculate offset direction (behind = opposite of heading)
  const offsetHeading = (heading + 180) % 360;
  const offsetHeadingRad = (offsetHeading * Math.PI) / 180;

  // Approximate lat/lng per meter (at equator ~0.00001 degrees per meter)
  const metersPerDegree = 111320;
  const latOffset = (Math.cos(offsetHeadingRad) * distanceBehindMeters) / metersPerDegree;
  const lngOffset = (Math.sin(offsetHeadingRad) * distanceBehindMeters) / metersPerDegree;

  return {
    lat: courierLat + latOffset,
    lng: courierLng + lngOffset,
  };
}

/**
 * Animation config for smooth heading follow
 */
export const HEADING_UPDATE_CONFIG = {
  updateIntervalMs: 100,      // Update every 100ms
  smoothingDuration: 500,     // Smooth over 500ms (5 frames @ 100ms)
  maxHeadingChangePerUpdate: 8, // Max 8 degrees per update
};
