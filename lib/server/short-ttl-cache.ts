const DEFAULT_TTL_MS = 5 * 60 * 1000;
const memory = new Map<string, { expiresAt: number; value: string }>();

function cacheRequest(key: string): Request {
  return new Request(`https://cache.local/${encodeURIComponent(key)}`);
}

function getWorkerCache(): Cache | null {
  try {
    const cachesApi = (globalThis as { caches?: { default?: Cache } }).caches;
    return cachesApi?.default ?? null;
  } catch {
    return null;
  }
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const workerCache = getWorkerCache();
  if (workerCache) {
    const hit = await workerCache.match(cacheRequest(key));
    if (!hit) {
      return null;
    }
    return (await hit.json()) as T;
  }

  const entry = memory.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    memory.delete(key);
    return null;
  }
  return JSON.parse(entry.value) as T;
}

export async function setCachedJson<T>(
  key: string,
  value: T,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<void> {
  const body = JSON.stringify(value);
  const workerCache = getWorkerCache();
  if (workerCache) {
    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": `s-maxage=${Math.max(1, Math.floor(ttlMs / 1000))}`,
    });
    await workerCache.put(cacheRequest(key), new Response(body, { headers }));
    return;
  }

  memory.set(key, { expiresAt: Date.now() + ttlMs, value: body });
}

export async function invalidateCached(key: string): Promise<void> {
  const workerCache = getWorkerCache();
  if (workerCache) {
    await workerCache.delete(cacheRequest(key));
  }
  memory.delete(key);
}

export const SHORT_TTL_CACHE_KEYS = {
  categories: "categories:active",
  vibeVideos: "vibe-videos:home",
} as const;
