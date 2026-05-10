/**
 * Client-side cache with TTL for settings page data.
 * Prevents re-fetching on every tab navigation within a session.
 * Uses stale-while-revalidate pattern for instant perceived loads.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>; // In-flight fetch deduplication
}

const cache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 120_000; // 2 minutes — settings rarely change

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > DEFAULT_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * Fetch with cache: returns cached data if fresh, otherwise fetches.
 * Features:
 * - Stale-while-revalidate: return stale data immediately, re-fetch in background
 * - In-flight deduplication: if a fetch is already in progress, reuse the same promise
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { staleWhileRevalidate?: boolean }
): Promise<T> {
  const cached = getCached<T>(key);
  
  if (cached) {
    if (options?.staleWhileRevalidate) {
      // Return stale data immediately, re-fetch in background (fire-and-forget)
      // Use a separate promise to avoid blocking the return
      const bgPromise = fetcher()
        .then(data => { setCached(key, data); return data; })
        .catch(() => cached); // On error, keep stale data
      return cached;
    }
    return cached;
  }

  // Check if there's an in-flight request for this key (deduplication)
  const entry = cache.get(key);
  if (entry?.promise) {
    return entry.promise as Promise<T>;
  }

  // Start the fetch and store the promise for deduplication
  const fetchPromise = fetcher()
    .then(data => {
      setCached(key, data);
      // Clear the in-flight promise
      const current = cache.get(key);
      if (current) delete current.promise;
      return data;
    })
    .catch(err => {
      // Clear the in-flight promise on error
      const current = cache.get(key);
      if (current) delete current.promise;
      throw err;
    });

  // Store the in-flight promise for deduplication
  cache.set(key, { data: null as unknown, timestamp: 0, promise: fetchPromise });

  return fetchPromise;
}

/**
 * Prefetch data into cache without blocking.
 * Call this on hover/focus of a nav link to preload the target page's data.
 */
export function prefetch<T>(key: string, fetcher: () => Promise<T>): void {
  // Don't prefetch if we already have fresh data
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp <= DEFAULT_TTL && entry.data !== null) {
    return;
  }
  // Don't prefetch if there's already an in-flight request
  if (entry?.promise) return;

  const fetchPromise = fetcher()
    .then(data => {
      setCached(key, data);
      const current = cache.get(key);
      if (current) delete current.promise;
      return data;
    })
    .catch(() => {
      const current = cache.get(key);
      if (current) delete current.promise;
    });

  cache.set(key, { data: null as unknown, timestamp: 0, promise: fetchPromise });
}