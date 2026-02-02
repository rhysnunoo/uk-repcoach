/**
 * Simple in-memory cache with TTL support
 * Suitable for serverless environments with warm function reuse
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every minute
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
  }

  /**
   * Get a cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set a cached value with TTL in seconds
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Delete a cached value
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Delete all cached values matching a prefix
   */
  deleteByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get or set a cached value with a factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    this.set(key, data, ttlSeconds);
    return data;
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const cache = new SimpleCache();

// Cache TTL presets (in seconds)
export const CACHE_TTL = {
  SHORT: 30,       // 30 seconds - for real-time data
  MEDIUM: 300,     // 5 minutes - for dashboard stats
  LONG: 900,       // 15 minutes - for analytics
  VERY_LONG: 3600, // 1 hour - for rarely changing data
} as const;

// Cache key generators
export const cacheKey = {
  dashboardRep: (userId: string) => `dashboard:rep:${userId}`,
  dashboardManager: (userId: string) => `dashboard:manager:${userId}`,
  repStats: (userId: string) => `stats:rep:${userId}`,
  teamStats: () => `stats:team`,
  analytics: (type: string) => `analytics:${type}`,
  callScores: (callId: string) => `scores:${callId}`,
  scripts: () => `scripts:active`,
};

/**
 * Invalidate cache when data changes
 */
export function invalidateUserCache(userId: string): void {
  cache.delete(cacheKey.dashboardRep(userId));
  cache.delete(cacheKey.dashboardManager(userId));
  cache.delete(cacheKey.repStats(userId));
}

export function invalidateTeamCache(): void {
  cache.delete(cacheKey.teamStats());
  cache.deleteByPrefix('dashboard:');
  cache.deleteByPrefix('analytics:');
}

export function invalidateCallCache(callId: string): void {
  cache.delete(cacheKey.callScores(callId));
  cache.deleteByPrefix('analytics:');
  cache.deleteByPrefix('stats:');
}
