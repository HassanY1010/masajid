import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class MemoryCacheService {
  private readonly logger = new Logger(MemoryCacheService.name);
  private static readonly store = new Map<string, CacheEntry<any>>();

  /**
   * Get cached data if valid, otherwise undefined
   */
  get<T>(key: string): T | undefined {
    const entry = MemoryCacheService.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      MemoryCacheService.store.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  /**
   * Set cache with TTL in milliseconds
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    // Limit cache size to prevent memory leaks
    if (MemoryCacheService.store.size > 1000) {
      const oldestKey = MemoryCacheService.store.keys().next().value;
      if (oldestKey) MemoryCacheService.store.delete(oldestKey);
    }

    MemoryCacheService.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Invalidate specific key or keys starting with prefix
   */
  invalidate(prefixOrKey: string): void {
    for (const key of MemoryCacheService.store.keys()) {
      if (key === prefixOrKey || key.startsWith(`${prefixOrKey}:`) || key.startsWith(prefixOrKey)) {
        MemoryCacheService.store.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    MemoryCacheService.store.clear();
  }
}
