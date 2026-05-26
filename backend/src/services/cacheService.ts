/**
 * CacheService — Dual-layer cache:
 *  - Layer 1: In-memory TTL Map (always available, zero latency)
 *  - Layer 2: Redis (when available, shared across server restarts)
 */
import { redisConnection, redisAvailable } from '../config/queue';

interface MemEntry<T> {
  data: T;
  expiresAt: number;
}

// ── In-Memory Cache ────────────────────────────────────────────────────────
class MemoryCache {
  private store = new Map<string, MemEntry<unknown>>();
  private maxSize: number;

  constructor(maxSize = 500) {
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
    // Evict oldest entry if at capacity
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
    this.store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) this.store.delete(k);
    }
  }

  size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }
}

const mem = new MemoryCache(200);

// ── Cache Keys ────────────────────────────────────────────────────────────
export const CK = {
  assignmentList:  'assignments:list',
  assignment: (id: string) => `assignments:${id}`,
};

// ── TTLs (seconds) ────────────────────────────────────────────────────────
const TTL = {
  list:   20,   // List invalidated quickly — new assignments should show fast
  detail: 120,  // Individual assignment cached for 2 minutes
};

// ── Public API ────────────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  // Try memory first
  const memHit = mem.get<T>(key);
  if (memHit !== null) {
    return memHit;
  }

  // Try Redis
  if (redisAvailable && redisConnection) {
    try {
      const raw = await redisConnection.get(key);
      if (raw) {
        const parsed = JSON.parse(raw) as T;
        // Backfill memory cache
        mem.set(key, parsed, TTL.detail);
        return parsed;
      }
    } catch (err) {
      console.warn('[Cache] Redis GET error for key:', key, err);
    }
  }

  return null;
}

export async function cacheSet<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  // Always write to memory
  mem.set(key, data, ttlSeconds);

  // Write to Redis if available
  if (redisAvailable && redisConnection) {
    try {
      await redisConnection.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    } catch (err) {
      console.warn('[Cache] Redis SET error for key:', key, err);
    }
  }
}

export async function cacheDelete(key: string): Promise<void> {
  mem.delete(key);
  if (redisAvailable && redisConnection) {
    try {
      await redisConnection.del(key);
    } catch (err) {
      console.warn('[Cache] Redis DEL error for key:', key, err);
    }
  }
}

export async function cacheDeletePrefix(prefix: string): Promise<void> {
  mem.deleteByPrefix(prefix);
  if (redisAvailable && redisConnection) {
    try {
      // Scan for matching keys (safe for production — avoids KEYS * blocking)
      const keys = await redisConnection.keys(`${prefix}*`);
      if (keys.length > 0) {
        await redisConnection.del(...keys);
      }
    } catch (err) {
      console.warn('[Cache] Redis prefix delete error:', err);
    }
  }
}

export const getCacheTTL = () => TTL;
export const getCacheStats = () => ({ memoryKeys: mem.size() });
