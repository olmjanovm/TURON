/**
 * COURIER TRACKING EXAMPLE & USAGE GUIDE
 * 
 * This file demonstrates how to integrate the refactored CourierMarker 
 * and YandexMap components into your courier tracking page.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { useYmaps3 } from '../../hooks/useYmaps3';
import { useYmaps21 } from '../../hooks/useYmaps21';
import { useGPS } from '../../hooks/useGPS';
import { useCompass } from '../../hooks/useCompass';
import { useRoute } from '../../hooks/useRoute';
import { useCourierOrderDetails } from '../../hooks/queries/useOrders';

// ── New modular components ──────────────────────────────────────────────────
import { YandexMap, CourierMarker } from '../../components/Map';
import { BottomPanel } from '../../components/BottomPanel/BottomPanel';

// Environment API keys
const YMAPS3_KEY = import.meta.env.VITE_YMAPS3_KEY || 'c3e2b675-cbbf-4886-b77a-3ed4e0d4f3f8';
const YMAPS21_KEY = import.meta.env.VITE_YMAPS21_KEY || 'c3e2b675-cbbf-4886-b77a-3ed4e0d4f3f8';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COURIER TRACKING PAGE (REFACTORED WITH MODULAR COMPONENTS)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Architecture:
 * ├── useYmaps3()        → Load Yandex Maps v3.0 API for rendering
 * ├── useYmaps21()       → Load Yandex Maps v2.1 API for routing (multiRouter)
 * ├── useGPS()           → Real-time GPS location & heading tracking
 * ├── useCompass()       → Device compass heading (with iOS permission)
 * ├── useRoute()         → React Query hook for pedestrian routing
 * ├── YandexMap          → Main map with camera rotation & markers
 * ├── CourierMarker      → Standalone red marker with heading rotation
 * └── BottomPanel        → Distance/time display & action buttons
 */
export function CourierMapPageRefactored() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Load Yandex Maps APIs
  // ──────────────────────────────────────────────────────────────────────────
  const { ymaps3, ready: map3Ready, error: map3Error } = useYmaps3(YMAPS3_KEY);
  const { ymaps, ready: map21Ready, error: map21Error } = useYmaps21(YMAPS21_KEY);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Initialize sensors
  // ──────────────────────────────────────────────────────────────────────────
  const { requestPermission, compassPermission } = useCompass();
  useGPS(); // Starts watching geolocation automatically

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Fetch order details (to get destination coordinates)
  // ──────────────────────────────────────────────────────────────────────────
  const { data: order, isLoading: orderLoading } = useCourierOrderDetails(
    orderId || '',
  );

  const destination: [number, number] =
    order?.destinationLng && order?.destinationLat
      ? [order.destinationLng, order.destinationLat]
      : [69.2687, 41.3111]; // Tashkent default

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Calculate pedestrian route
  // ──────────────────────────────────────────────────────────────────────────
  const { isLoading: routeLoading } = useRoute(
    map21Ready ? ymaps : null,
    destination,
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Event handlers
  // ──────────────────────────────────────────────────────────────────────────
  const handleCall = () => {
    console.log('📞 Calling courier for order:', orderId);
    // TODO: Call backend API to notify courier
  };

  const handleArrived = () => {
    console.log('✓ Courier arrived at destination:', orderId);
    // Navigate to proof-of-delivery page
    navigate(`/courier/order/${orderId}/proof-of-delivery`);
  };

  const handleProblem = () => {
    console.log('⚠️ Issue reported for order:', orderId);
    // TODO: Open issue dialog or navigate to support
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Loading state
  // ──────────────────────────────────────────────────────────────────────────
  if (orderLoading || !map3Ready) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#1a1a2e]">
        <div className="text-center">
          <div className="mb-4 inline-block">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-blue-200" />
          </div>
          <p className="text-white font-semibold">Loading map...</p>
          {(map3Error || map21Error) && (
            <p className="text-red-400 text-sm mt-3">
              {map3Error || map21Error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Main render
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1a1a2e]">
      {/* FULL-SCREEN MAP with auto-rotating camera */}
      {ymaps3 && (
        <YandexMap
          ymaps3={ymaps3}
          destination={destination}
          onMapReady={() => console.log('✓ Map ready')}
        />
      )}

      {/* BACK BUTTON */}
      <button
        onClick={() => navigate('/courier/orders')}
        className="absolute top-4 left-4 z-40 flex h-10 w-10 items-center justify-center
          rounded-full border border-white/20 bg-slate-950/60 text-white
          shadow-lg backdrop-blur-sm hover:bg-slate-950/80 active:scale-95 
          transition-all"
        title="Back to orders"
        aria-label="Go back"
      >
        <ArrowLeft size={18} />
      </button>

      {/* iOS COMPASS PERMISSION BUTTON */}
      {compassPermission === 'unknown' && (
        <button
          onClick={requestPermission}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40
            bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800
            text-white rounded-full px-8 py-4 text-sm font-bold shadow-2xl
            active:scale-95 transition-all backdrop-blur-sm"
        >
          📡 Enable Navigation
        </button>
      )}

      {/* BOTTOM PANEL with status & actions */}
      <BottomPanel
        routeLoading={routeLoading}
        onCall={handleCall}
        onArrived={handleArrived}
        onProblem={handleProblem}
      />
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ADVANCED: Using CourierMarker Standalone (if you need custom map solution)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function CourierMarkerExample() {
  // Example: Get heading from Zustand store
  // const heading = useCourierStore((s) => s.smoothedHeading);

  return (
    <div className="w-64 h-64 bg-slate-900 rounded-lg flex items-center justify-center">
      <CourierMarker heading={45} />
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * USAGE SUMMARY
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 1. YandexMap Component
 *    ├── Props:
 *    │   ├── ymaps3 (any)              — Yandex Maps v3 instance
 *    │   ├── destination [lng, lat]    — Restaurant/delivery location
 *    │   └── onMapReady? ()             — Callback when ready
 *    │
 *    ├── Features:
 *    │   ├── 3D perspective (45° tilt)
 *    │   ├── Auto-rotating camera (azimuth based on heading)
 *    │   ├── Red pyramid courier marker
 *    │   ├── Green route polyline
 *    │   ├── Red destination teardrop
 *    │   └── Real-time position updates
 *    │
 *    └── State from Zustand:
 *        ├── coords: [lng, lat] | null
 *        ├── smoothedHeading: 0-360
 *        └── routePoints: [lng, lat][]
 * 
 * 2. CourierMarker Component
 *    ├── Props:
 *    │   └── heading: number (0-360 degrees)
 *    │
 *    ├── Features:
 *    │   ├── Red gradient pyramid/triangle
 *    │   ├── Smooth CSS rotation (0.3s ease-out)
 *    │   ├── Drop shadow
 *    │   └── Highlight stripe for depth
 *    │
 *    └── Use case: Standalone marker in custom maps
 * 
 * 3. Data Flow
 *    GPS + Compass → Zustand Store → Components (auto-subscribe)
 *    ├── useGPS()              → coords, gpsHeading
 *    ├── useCompass()          → compassHeading → smoothedHeading (low-pass filter)
 *    ├── useRoute()            → routePoints, distance, time
 *    └── Components re-render on store updates
 * 
 * 4. Low-Pass Filter (Heading Smoothing)
 *    Formula: smoothed = (old * 0.8) + (raw * 0.2)
 *    Benefits:
 *    ├── Eliminates compass jitter
 *    ├── Smooth marker rotation
 *    ├── Smooth camera azimuth rotation
 *    └── Handles 359°→1° edge case correctly
 * 
 * 5. iOS Considerations
 *    ├── DeviceOrientation requires explicit permission (iOS 13+)
 *    ├── requestPermission() must be called from user gesture (click/tap)
 *    ├── Android: Auto-start without permission
 *    └── webkitCompassHeading: Direct magnetic north (no transformation)
 * 
 * 6. Environment Variables (.env)
 *    VITE_YMAPS3_KEY   → Yandex Maps v3.0 API key
 *    VITE_YMAPS21_KEY  → Yandex Maps v2.1 API key (for routing)
 *    VITE_MAP_LANGUAGE → "uz_UZ" (for Uzbek labels)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */
