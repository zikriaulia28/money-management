// Simple in-memory fetch cache with TTL and auto-prune
// Data persists across page navigations (same SPA session)
// Invalidates on mutation (add/edit/delete) or after TTL

type CacheEntry = {
  data: unknown;
  expiry: number;
};

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 60_000; // 60 seconds
const MAX_ENTRIES = 100; // safety limit: auto-prune oldest when exceeded

let pruneCounter = 0;

function pruneIfNeeded() {
  if (cache.size <= MAX_ENTRIES) return;

  // Every 10 writes, sweep expired entries + oldest 20%
  pruneCounter++;
  if (pruneCounter % 10 !== 0) return;

  const now = Date.now();

  // Remove expired entries
  for (const [key, entry] of cache) {
    if (entry.expiry <= now) {
      cache.delete(key);
    }
  }

  // If still over limit, remove oldest entries
  if (cache.size > MAX_ENTRIES) {
    const sorted = [...cache.entries()]
      .sort(([, a], [, b]) => a.expiry - b.expiry);
    const toRemove = Math.ceil(cache.size * 0.2);
    for (let i = 0; i < toRemove && cache.size > MAX_ENTRIES; i++) {
      cache.delete(sorted[i][0]);
    }
  }
}

export function clearCache(key?: string) {
  if (key) {
    // Support prefix matching: clears all keys starting with given prefix
    if (cache.has(key)) {
      cache.delete(key);
    } else {
      // Treat as prefix — clear all matching keys
      for (const k of cache.keys()) {
        if (k.startsWith(key)) {
          cache.delete(k);
        }
      }
    }
  } else {
    cache.clear();
  }
}

export async function cachedFetch<T>(
  url: string,
  options?: { ttl?: number; bust?: boolean }
): Promise<T> {
  const { ttl = DEFAULT_TTL, bust } = options ?? {};
  const cacheKey = `GET:${url}`;

  // Bust cache for mutations
  if (bust) {
    cache.delete(cacheKey);
  }

  // Return cached if fresh
  const entry = cache.get(cacheKey);
  if (entry && entry.expiry > Date.now()) {
    return entry.data as T;
  }

  // Fetch fresh
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const data = (await res.json()) as T;

  // Cache it
  cache.set(cacheKey, { data, expiry: Date.now() + ttl });
  pruneIfNeeded();

  return data;
}
