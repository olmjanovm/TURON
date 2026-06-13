'use client';

import { PositionSmoother } from './kalman-filter';

export interface GpsTick {
  lat: number;
  lng: number;
  speedKmh: number | null;
  accuracyMeters: number;
  headingDeg: number | null;
  timestamp: number;
}

interface WatcherOptions {
  onTick: (tick: GpsTick) => void;
  onError?: (err: GeolocationPositionError) => void;
}

/**
 * watchPosition wrapper:
 *  • enableHighAccuracy: true, maximumAge: 0, timeout: 5000
 *  • Kalman filter — GPS jitter yo'qotiladi
 *  • Battery throttle — sekin harakatda tick chastotasi pasayadi
 *      < 5 km/h  → 5000ms
 *      5-20 km/h → 2000ms
 *      > 20 km/h → 1000ms
 *  • document.hidden bo'lganda — yana throttle (10s)
 */
export class GpsWatcher {
  private watchId: number | null = null;
  private smoother = new PositionSmoother();
  private lastEmitTs = 0;
  private opts: WatcherOptions | null = null;

  start(opts: WatcherOptions): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    this.stop();
    this.opts = opts;
    try {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => this.handlePosition(pos),
        (err) => opts.onError?.(err),
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5_000,
        },
      );
    } catch {/* */}
  }

  private handlePosition(pos: GeolocationPosition): void {
    if (!this.opts) return;

    const now = Date.now();
    const speedMs = pos.coords.speed;
    const speedKmh = speedMs != null && speedMs >= 0 ? speedMs * 3.6 : null;

    // Battery throttle
    let throttle = 1000;
    if (typeof document !== 'undefined' && document.hidden) {
      throttle = 10_000;
    } else if (speedKmh != null) {
      if (speedKmh < 5) throttle = 5_000;
      else if (speedKmh < 20) throttle = 2_000;
      else throttle = 1_000;
    }

    if (now - this.lastEmitTs < throttle) return;
    this.lastEmitTs = now;

    const accuracy = pos.coords.accuracy ?? 15;
    const smoothed = this.smoother.smooth(pos.coords.latitude, pos.coords.longitude, accuracy);

    this.opts.onTick({
      lat: smoothed.lat,
      lng: smoothed.lng,
      speedKmh,
      accuracyMeters: accuracy,
      headingDeg: pos.coords.heading,
      timestamp: now,
    });
  }

  /** Tunnelda yoki signal yo'qolganda smoother'ni reset qilish kerak bo'lishi mumkin */
  resetSmoother(initialLat?: number, initialLng?: number): void {
    this.smoother.reset(initialLat, initialLng);
    this.lastEmitTs = 0;
  }

  stop(): void {
    if (this.watchId != null && typeof navigator !== 'undefined' && navigator.geolocation) {
      try { navigator.geolocation.clearWatch(this.watchId); } catch {/* */}
    }
    this.watchId = null;
    this.opts = null;
  }

  isActive(): boolean {
    return this.watchId != null;
  }
}
