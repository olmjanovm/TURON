type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

export class MemoryCache {
  private static instance: MemoryCache;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTtl: number = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache();
    }
    return MemoryCache.instance;
  }

  public set<T>(key: string, data: T, ttlMs?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + (ttlMs || this.defaultTtl),
    });
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const menuCache = MemoryCache.getInstance();
