import React, { useEffect, useRef } from 'react';
import { useCourierStore } from '../../store/courierStore';
import { CourierMarker } from './CourierMarker';

interface YandexMapProps {
  /**
   * Yandex Maps v3 instance (loaded via useYmaps3 hook)
   */
  ymaps3: any;
  
  /**
   * Destination coordinates [longitude, latitude]
   */
  destination: [number, number];
  
  /**
   * Callback when map is ready (optional)
   */
  onMapReady?: () => void;
}

/**
 * Main Yandex Map component with auto-rotating camera and courier marker.
 * 
 * Features:
 * - 3D perspective with 45° tilt (Yandex Navigator style)
 * - Camera rotates based on courier heading (azimuth)
 * - Real-time marker positioning from GPS
 * - Route polyline rendering
 * - Destination marker
 * 
 * The map container is positioned absolutely and filled with the map instance.
 */
export const YandexMap: React.FC<YandexMapProps> = ({
  ymaps3,
  destination,
  onMapReady,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const courierMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const routeFeatureRef = useRef<any>(null);

  // Get courier state from Zustand store
  const coords = useCourierStore((s) => s.coords);
  const smoothedHeading = useCourierStore((s) => s.smoothedHeading);
  const routePoints = useCourierStore((s) => s.routePoints);

  // ────────────────────────────────────────────────────────────────────────
  // Initialize map and markers
  // ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || !ymaps3) return;

    const {
      YMap,
      YMapDefaultSchemeLayer,
      YMapDefaultFeaturesLayer,
      YMapMarker,
      YMapFeature,
    } = ymaps3;

    try {
      // Create map with 3D perspective and dark theme
      const initialCoords = coords ?? [69.2401, 41.2995]; // Tashkent default
      const map = new YMap(mapContainerRef.current, {
        location: {
          center: initialCoords,
          zoom: 17,
          azimuth: 0,
          tilt: 45, // 3D perspective
        },
        mode: '3d',
      });

      // Add default layers
      map.addChild(new YMapDefaultSchemeLayer({ theme: 'dark' }));
      map.addChild(new YMapDefaultFeaturesLayer());

      mapInstanceRef.current = map;

      // ── Courier Marker ──────────────────────────────────────────────────
      const courierMarkerEl = document.createElement('div');
      courierMarkerEl.style.cssText = `
        display: flex;
        align-items: center;
        justify-center;
      `;
      
      const markerRoot = document.createElement('div');
      markerRoot.id = 'courier-marker-root';
      courierMarkerEl.appendChild(markerRoot);

      const courierMarker = new YMapMarker(
        {
          coordinates: initialCoords,
          anchor: [0.5, 0.75], // Center horizontally, 75% down vertically
          zIndex: 200,
        },
        courierMarkerEl,
      );
      map.addChild(courierMarker);
      courierMarkerRef.current = {
        marker: courierMarker,
        element: markerRoot,
      };

      // ── Destination Marker (Restaurant) ────────────────────────────────
      const destMarkerEl = document.createElement('div');
      destMarkerEl.innerHTML = DESTINATION_SVG;
      destMarkerEl.style.cssText = `
        display: flex;
        align-items: center;
        justify-center;
      `;

      const destMarker = new YMapMarker(
        {
          coordinates: destination,
          anchor: [0.5, 1], // Center horizontally, bottom at location
          zIndex: 100,
        },
        destMarkerEl,
      );
      map.addChild(destMarker);
      destMarkerRef.current = destMarker;

      onMapReady?.();

      return () => {
        try {
          map.destroy?.();
        } catch {
          // Cleanup error - ignore
        }
      };
    } catch (error) {
      console.error('Failed to initialize Yandex Map:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ymaps3]);

  // ────────────────────────────────────────────────────────────────────────
  // Update map center when courier location changes
  // ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!coords || !mapInstanceRef.current || !courierMarkerRef.current) return;

    const { marker } = courierMarkerRef.current;
    marker.update({ coordinates: coords });

    mapInstanceRef.current.update({
      location: {
        center: coords,
        duration: 300,
      },
    });
  }, [coords]);

  // ────────────────────────────────────────────────────────────────────────
  // Rotate map camera and update marker heading
  // ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current || !courierMarkerRef.current) return;

    const { element } = courierMarkerRef.current;

    // Re-render CourierMarker with new heading via React portal
    // For now, we'll update the DOM directly with the marker component
    if (element) {
      // Clear existing children
      element.innerHTML = '';
      
      // Create a temporary container to render React component
      const tempContainer = document.createElement('div');
      element.appendChild(tempContainer);

      // Note: In a real application, you might want to use a React portal
      // or refactor this to use a ref callback instead
      // For simplicity, we're using direct DOM manipulation here
      
      // Update marker SVG with rotation
      const markerHTML = `
        <div style="
          transform: rotate(${smoothedHeading}deg);
          transition: transform 0.3s ease-out;
          display: flex;
          align-items: center;
          justify-center;
        ">
          ${COURIER_MARKER_SVG}
        </div>
      `;
      element.innerHTML = markerHTML;
    }

    // Rotate map camera (Yandex Navigator effect)
    mapInstanceRef.current.update({
      location: {
        azimuth: smoothedHeading,
        duration: 150,
      },
    });
  }, [smoothedHeading]);

  // ────────────────────────────────────────────────────────────────────────
  // Update route polyline
  // ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current || routePoints.length < 2 || !ymaps3) return;

    const { YMapFeature } = ymaps3;

    // Remove old route
    if (routeFeatureRef.current) {
      try {
        mapInstanceRef.current.removeChild(routeFeatureRef.current);
      } catch {
        // Cleanup error - ignore
      }
    }

    // Create new green route polyline
    const routeFeature = new YMapFeature({
      geometry: {
        type: 'LineString',
        coordinates: routePoints,
      },
      style: {
        stroke: [{ color: '#4CAF50', width: 6 }],
        strokeOpacity: 0.9,
      },
    });

    mapInstanceRef.current.addChild(routeFeature);
    routeFeatureRef.current = routeFeature;
  }, [routePoints, ymaps3]);

  return (
    <div
      ref={mapContainerRef}
      className="absolute inset-0 w-full h-full rounded-[20px] overflow-hidden"
      aria-label="Delivery tracking map"
    />
  );
};

// ────────────────────────────────────────────────────────────────────────
// SVG Constants
// ────────────────────────────────────────────────────────────────────────

/**
 * Courier marker (red pyramid/triangle) SVG
 */
const COURIER_MARKER_SVG = `
<svg width="44" height="48" viewBox="0 0 44 48" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="courierGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EF4444"/>
      <stop offset="100%" stop-color="#DC2626"/>
    </linearGradient>
    <filter id="courierShadow">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/>
    </filter>
  </defs>
  
  <!-- Main red pyramid -->
  <polygon
    points="22,4 40,44 22,36 4,44"
    fill="url(#courierGradient)"
    stroke="#991B1B"
    stroke-width="1.5"
    filter="url(#courierShadow)"
  />
  
  <!-- Highlight stripe -->
  <polygon
    points="22,8 36,40 22,33"
    fill="rgba(255,255,255,0.25)"
  />
</svg>
`;

/**
 * Destination marker (restaurant teardrop) SVG
 */
const DESTINATION_SVG = `
<svg width="40" height="48" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="destShadow">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/>
    </filter>
  </defs>
  
  <!-- Teardrop shape -->
  <path
    d="M20 4 C26.627 4 32 9.373 32 16 C32 24 20 44 20 44 C20 44 8 24 8 16 C8 9.373 13.373 4 20 4 Z"
    fill="#E53935"
    stroke="#fff"
    stroke-width="2"
    filter="url(#destShadow)"
  />
  
  <!-- White center dot -->
  <circle cx="20" cy="16" r="6" fill="#fff" opacity="0.95"/>
</svg>
`;
