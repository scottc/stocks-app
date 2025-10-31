// lib/cache.ts
type CacheEntry<T> = { data: T; timestamp: number };
type Pending<T> = Promise<T>;

export const DEFAULT_TTL = 23 * 60 * 60 * 1000; // 23 hours in milliseconds

export class TinyCache<K, V> {
  // TODO: consider using arrays, or object dictionarys could be faster...
  private cache = new Map<K, CacheEntry<V>>();
  private pending = new Map<K, Pending<V>>();

  /** Get or fetch with deduplication */
  async getOrFetch(
    key: K,
    fetchFn: () => Promise<V>,
    ttl: number = DEFAULT_TTL,
  ): Promise<V> {
    const now = Date.now();

    // 1. Return cached value if fresh
    const cached = this.cache.get(key);
    if (cached && now - cached.timestamp < ttl) {
      console.log(`[Memory] fetched:`, key, cached);
      return cached.data;
    }

    // 2. Deduplicate in-flight requests
    if (this.pending.has(key)) {
      console.log(
        `[Memory] duplicate pending inflight request, referencing previous request:`,
        key,
      );
      return this.pending.get(key)!;
    }

    // 3. Fetch, cache, and resolve
    const promise = fetchFn()
      .then((data) => {
        this.cache.set(key, { data, timestamp: now });
        this.pending.delete(key);
        return data;
      })
      .catch((err: unknown) => {
        this.pending.delete(key);
        throw err;
      });

    console.log("[Network] fetching:", key);
    this.pending.set(key, promise);
    return promise;
  }

  /** Manual invalidate */
  invalidate(key?: K) {
    if (key) {
      this.cache.delete(key);
      this.pending.delete(key);
    } else {
      this.cache.clear();
      this.pending.clear();
    }
  }

  /** Get current cache size */
  size() {
    return this.cache.size;
  }
}

/** @deprecated Don't use a singleton global, use per resource caches instead. It avoids key conflicts, and helps with memory management... probably. */
export const cache = new TinyCache<string, any>();
