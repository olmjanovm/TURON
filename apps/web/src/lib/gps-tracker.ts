'use client';

/**
 * GPS tracker — throttled geolocation.watchPosition for couriers.
 *
 * - Active delivery: 3–5 s
 * - Online but idle: 15–30 s
 * - Background: 60 s
 * - Skips emit if coords moved <10 m AND speed <1 m/s (saves battery + traffic)
 * - Auto-pauses on permission denied / page hidden (configurable)
 */

export interface GpsSample {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  accuracy: number;
  ts: number;
}

export type GpsMode = 'active' | 'idle' | 'background' | 'off';

const MODE_INTERVAL_MS: Record<Exclude<GpsMode, 'off'>, number> = {
  active: 4_000,
  idle: 20_000,
  background: 60_000,
};

const MIN_MOVE_METERS = 10;
const MIN_SPEED_MS = 1;

interface StartOptions {
  mode: GpsMode;
  onSample: (s: GpsSample) => void;
  onError?: (err: GeolocationPositionError) => void;
}

export class GpsTracker {
  private watchId: number | null = null;
  private mode: GpsMode = 'off';
  private lastSample: GpsSample | null = null;
  private lastEmittedAt = 0;
  private opts: StartOptions | null = null;

  /** Distance between two coords (Haversine, meters) */
  private static distance(a: GpsSample, b: { lat: number; lng: number }): number {
    const R = 6_371_000;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  start(opts: StartOptions): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    this.stop();
    this.opts = opts;
    this.mode = opts.mode;

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handlePosition(pos),
      (err) => opts.onError?.(err),
      {
        enableHighAccuracy: opts.mode === 'active',
        maximumAge: opts.mode === 'background' ? 30_000 : 5_000,
        timeout: 30_000,
      },
    );
  }

  setMode(mode: GpsMode): void {
    if (mode === this.mode) return;
    const opts = this.opts;
    if (mode === 'off' || !opts) {
      this.stop();
      this.mode = 'off';
      return;
    }
    this.start({ ...opts, mode });
  }

  stop(): void {
    if (this.watchId != null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
    }
    this.watchId = null;
    this.mode = 'off';
  }

  private handlePosition(pos: GeolocationPosition): void {
    if (!this.opts || this.mode === 'off') return;

    const sample: GpsSample = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      accuracy: pos.coords.accuracy,
      ts: pos.timestamp,
    };

    const now = Date.now();
    const interval = MODE_INTERVAL_MS[this.mode];

    if (now - this.lastEmittedAt < interval) return;

    if (this.lastSample) {
      const moved = GpsTracker.distance(this.lastSample, sample);
      const speed = sample.speed ?? 0;
      if (moved < MIN_MOVE_METERS && speed < MIN_SPEED_MS) return;
    }

    this.lastSample = sample;
    this.lastEmittedAt = now;
    this.opts.onSample(sample);
  }
}
