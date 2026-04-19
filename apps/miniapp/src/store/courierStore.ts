import { create } from 'zustand';
import { lowPassFilterCircular } from '../lib/headingUtils';

export type CourierDeliveryStage = 1 | 2 | 3;

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderInfo {
  orderId: string;
  orderItems: OrderItem[];
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerCoords: [number, number] | null;
  restaurantCoords: [number, number] | null;
}

interface CourierState {
  // ── GPS ────────────────────────────────────────────────────────────────────
  /** [longitude, latitude] — GeoJSON / ymaps3 format */
  coords: [number, number] | null;
  accuracy: number | null;
  speed: number | null;
  /** Raw heading from GPS (faqat harakatda ishlaydi, zaxira) */
  gpsHeading: number | null;

  // ── Kompas ─────────────────────────────────────────────────────────────────
  /** Raw heading from DeviceOrientation sensor */
  compassHeading: number | null;
  /** Low-pass filtered heading — marker + kamera shu qiymatdan aylanadi */
  smoothedHeading: number;
  compassPermission: 'unknown' | 'granted' | 'denied';

  // ── Marshrut (ymaps 2.1 multiRouter dan) ──────────────────────────────────
  /** Qolgan masofa (metr) */
  distanceLeft: number | null;
  /** Qolgan vaqt (sekund) */
  timeLeft: number | null;
  /** Polyline nuqtalari [longitude, latitude][] */
  routePoints: [number, number][];

  // ── Delivery Stage & Info ─────────────────────────────────────────────────
  deliveryStage: CourierDeliveryStage;
  orderInfo: OrderInfo | null;

  // ── Actions ────────────────────────────────────────────────────────────────
  setCoords: (coords: [number, number], accuracy: number) => void;
  setGpsData: (lat: number, lng: number, speed: number | null, heading: number | null) => void;
  setGpsHeading: (heading: number) => void;
  setCompassHeading: (raw: number) => void;
  setCompassPermission: (status: 'granted' | 'denied') => void;
  setRouteInfo: (distance: number, time: number, points: [number, number][]) => void;
  setDeliveryStage: (stage: CourierDeliveryStage) => void;
  setOrderInfo: (info: OrderInfo) => void;
  resetCourierState: () => void;
  _updateSmoothedHeading: () => void;
}

export const useCourierStore = create<CourierState>((set, get) => ({
  coords: null,
  accuracy: null,
  speed: null,
  gpsHeading: null,
  compassHeading: null,
  smoothedHeading: 0,
  compassPermission: 'unknown',
  distanceLeft: null,
  timeLeft: null,
  routePoints: [],
  
  deliveryStage: 1,
  orderInfo: null,

  setCoords: (coords, accuracy) => set({ coords, accuracy }),

  setGpsData: (lat, lng, speed, heading) => {
    set({ coords: [lng, lat], speed, gpsHeading: heading });
    get()._updateSmoothedHeading();
  },

  /**
   * GPS heading — compass yo'q bo'lganda smoothedHeading ni ham yangilaydi
   * (sekinroq filtr: 0.15 — GPS heading kompasdan ko'ra o'zgaruvchan)
   */
  setGpsHeading: (heading) => {
    set({ gpsHeading: heading });
    get()._updateSmoothedHeading();
  },

  /**
   * Compass heading — asosiy manba.
   * Low-pass filter (0.15) bilan silliqlangan smoothedHeading ni yangilaydi.
   */
  setCompassHeading: (raw) => {
    set({ compassHeading: raw });
    get()._updateSmoothedHeading();
  },

  setCompassPermission: (status) => set({ compassPermission: status }),

  setRouteInfo: (distance, time, points) =>
    set({ distanceLeft: distance, timeLeft: time, routePoints: points }),
    
  setDeliveryStage: (stage) => set({ deliveryStage: stage }),
  
  setOrderInfo: (info) => set({ orderInfo: info }),

  resetCourierState: () =>
    set({
      coords: null,
      accuracy: null,
      speed: null,
      gpsHeading: null,
      compassHeading: null,
      smoothedHeading: 0,
      compassPermission: 'unknown',
      distanceLeft: null,
      timeLeft: null,
      routePoints: [],
      deliveryStage: 1,
      orderInfo: null,
    }),

  _updateSmoothedHeading: () => {
    const { speed, gpsHeading, compassHeading, smoothedHeading } = get();
    
    let targetHeading = compassHeading;
    
    // Speed > 1.5 m/s (~5.4 km/h) = override with highly accurate GPS bearing
    if (speed !== null && speed > 1.5 && gpsHeading !== null) {
      targetHeading = gpsHeading;
    }

    if (targetHeading === null) return;
    
    const newSmoothed = lowPassFilterCircular(smoothedHeading, targetHeading, 0.15);
    set({ smoothedHeading: newSmoothed });
  }
}));
