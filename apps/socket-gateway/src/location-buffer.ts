import type { Redis as RedisClient } from 'ioredis';
import jwt from 'jsonwebtoken';
import { env } from './config.js';

/**
 * Backend REST'ga GPS yozish uchun service JWT — gateway JWT_SECRET bilan
 * imzolaydi, courier rolida. Backend xuddi shu sekret bilan tekshiradi.
 * Token kichik TTL (60s) — har flush uchun yangi imzolanadi.
 */
function signCourierToken(courierId: string): string {
  return jwt.sign({ id: courierId, role: 'COURIER' }, env.JWT_SECRET, { expiresIn: '60s' });
}

/**
 * Location write buffer.
 *
 * Why: GPS samples come in at ~4 s. Writing every sample to Postgres melts the DB.
 * Pattern (matches eski miniapp):
 *   - live coords → Redis (TTL ~60 s) — read by admin/customer for live tracking
 *   - batched DB write every GPS_DB_FLUSH_MS (default 20 s) via backend REST
 *
 * If Redis is not configured, we keep an in-memory map (single-instance only).
 */

export interface LocationSample {
  courierId: string;
  orderId: string | null;
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  accuracy: number;
  ts: number;
}

const memCache = new Map<string, LocationSample>();
const pendingDbWrite = new Map<string, LocationSample>();
let flushTimer: NodeJS.Timeout | null = null;

export async function recordLive(redis: RedisClient | null, sample: LocationSample): Promise<void> {
  const key = `courier:loc:${sample.courierId}`;
  const value = JSON.stringify(sample);

  if (redis) {
    await redis.set(key, value, 'EX', env.GPS_REDIS_TTL_S).catch(() => {/* swallow */});
  } else {
    memCache.set(sample.courierId, sample);
  }

  if (sample.orderId) {
    pendingDbWrite.set(sample.orderId, sample);
    ensureFlushScheduled();
  }
}

function ensureFlushScheduled(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushPendingToBackend();
  }, env.GPS_DB_FLUSH_MS);
}

async function flushPendingToBackend(): Promise<void> {
  if (pendingDbWrite.size === 0) return;
  const batch = Array.from(pendingDbWrite.values());
  pendingDbWrite.clear();

  await Promise.allSettled(
    batch.map((s) => {
      const token = signCourierToken(s.courierId);
      return fetch(`${env.BACKEND_URL}/courier/order/${s.orderId}/location`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: s.lat,
          longitude: s.lng,
          heading: s.heading,
          speed: s.speed,
          accuracy: s.accuracy,
        }),
      }).catch(() => null);
    }),
  );
}

export async function getLive(redis: RedisClient | null, courierId: string): Promise<LocationSample | null> {
  if (redis) {
    const raw = await redis.get(`courier:loc:${courierId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LocationSample;
    } catch {
      return null;
    }
  }
  return memCache.get(courierId) ?? null;
}
