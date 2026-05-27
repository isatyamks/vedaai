import { redisConnection, redisAvailable } from '../config/queue';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    if (this.store.size >= this.maxSize) {
      const oldest = this.store.keys().next().value;
      if (oldest) this.store.delete(oldest);
    }
    this.store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  size(): number {
    return this.store.size;
  }
}

const mem = new MemoryCache(200);

export const CK = {
  list: 'assignments:list',
  detail: (id: string) => `assignments:${id}`,
} as const;

const TTL = { list: 20, detail: 120 } as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  const hit = mem.get<T>(key);
  if (hit !== null) return hit;

  if (redisAvailable && redisConnection) {
    try {
      const raw = await redisConnection.get(key);
      if (raw) {
        const parsed = JSON.parse(raw) as T;
        mem.set(key, parsed, TTL.detail);
        return parsed;
      }
    } catch {}
  }

  return null;
}

export async function cacheSet<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  mem.set(key, data, ttlSeconds);

  if (redisAvailable && redisConnection) {
    try {
      await redisConnection.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    } catch {}
  }
}

export async function cacheDelete(key: string): Promise<void> {
  mem.delete(key);

  if (redisAvailable && redisConnection) {
    try {
      await redisConnection.del(key);
    } catch {}
  }
}

export async function cacheDeletePrefix(prefix: string): Promise<void> {
  mem.deleteByPrefix(prefix);

  if (redisAvailable && redisConnection) {
    try {
      const keys = await redisConnection.keys(`${prefix}*`);
      if (keys.length > 0) await redisConnection.del(...keys);
    } catch {}
  }
}

export const getCacheTTL = () => TTL;
export const getCacheStats = () => ({ memoryKeys: mem.size() });
