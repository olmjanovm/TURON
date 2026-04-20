import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * BullMQ requires `maxRetriesPerRequest: null` to work correctly.
 */
export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});