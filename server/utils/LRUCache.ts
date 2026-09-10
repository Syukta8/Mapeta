/**
 * Internal storage wrapper for cached values with TTL.
 */
interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

/**
 * Generic Least-Recently-Used (LRU) cache with time-to-live (TTL) expiry.
 * Employs JavaScript Map's insertion-order property for O(1) reads, updates, and evictions.
 */
export class LRUCache<K, V> {
  private readonly map = new Map<K, CacheEntry<V>>();
  private readonly maxSize: number;
  private readonly defaultTtlMs: number;

  /**
   * @param maxSize Maximum number of items the cache will hold before evicting the oldest entry.
   * @param defaultTtlMs Time-to-live in milliseconds for each cached entry.
   */
  constructor(maxSize = 500, defaultTtlMs = 300_000) {
    this.maxSize = Math.max(1, maxSize);
    this.defaultTtlMs = Math.max(1, defaultTtlMs);
  }

  /**
   * Retrieves an item from the cache.
   * If found and not expired, promotes the item to the most-recently-used position.
   * If expired, removes the item and returns undefined.
   */
  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }

    // Refresh LRU order: delete and re-insert at tail
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  /**
   * Inserts or updates an item in the cache.
   * Evicts the least-recently-used entry if the cache is at capacity.
   *
   * @param key Cache key.
   * @param value Cache value.
   * @param customTtlMs Optional custom TTL for this specific entry.
   */
  set(key: K, value: V, customTtlMs?: number): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      // Evict oldest (first inserted key in Map)
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }

    const ttl = customTtlMs !== undefined ? Math.max(1, customTtlMs) : this.defaultTtlMs;
    this.map.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Checks if a key exists in cache and has not expired.
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Deletes an item from the cache.
   */
  delete(key: K): boolean {
    return this.map.delete(key);
  }

  /**
   * Clears all items from the cache.
   */
  clear(): void {
    this.map.clear();
  }

  /**
   * Returns current count of entries currently in cache.
   */
  get size(): number {
    return this.map.size;
  }
}
