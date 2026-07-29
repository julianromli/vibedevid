/**
 * Browser localStorage helpers with TTL. Used to avoid refetching hot
 * public lists on every client navigation / filter change.
 */

interface StoredEnvelope<T> {
  value: T;
  expiresAt: number;
}

function canUseLocalStorage(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const probe = "__vibedev_cache_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function clientStorageGet<T>(key: string): T | null {
  if (!canUseLocalStorage()) return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredEnvelope<T>;
    if (!parsed || typeof parsed.expiresAt !== "number") {
      window.localStorage.removeItem(key);
      return null;
    }
    if (Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(key);
      return null;
    }
    return parsed.value;
  } catch {
    return null;
  }
}

export function clientStorageSet<T>(key: string, value: T, ttlMs: number): void {
  if (!canUseLocalStorage()) return;

  try {
    const envelope: StoredEnvelope<T> = {
      value,
      expiresAt: Date.now() + ttlMs,
    };
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch (error) {
    console.warn("[cache/client-storage] set failed:", error);
  }
}

export function clientStorageRemove(key: string): void {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
