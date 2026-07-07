// Simple in-memory fetch cache with TTL
// Data persists across page navigations (same SPA session)
// Invalidates on mutation (add/edit/delete) or after TTL

type CacheEntry = {
  data: unknown;
  expiry: number;
};

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 60_000; // 60 seconds

export function clearCache(key?: string) {
  if (key) {
    cache.delete(key);
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
  return data;
}
