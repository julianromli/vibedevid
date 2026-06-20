import i18n from "@/i18n";
import type { Locale } from "@/i18n";
import type { SortBy } from "@/types/homepage";

export function getSingleSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeSortParam(value: string | undefined): SortBy {
  return value === "top" || value === "newest" || value === "trending" ? value : "newest";
}

/**
 * Read the server-side locale cookie. The cookie helper is imported lazily so
 * `@tanstack/react-start/server` (and its Node-only / `react-dom/server`
 * dependencies) never reach the client bundle. This module is reachable from
 * the client route graph, so a top-level server-only import would break
 * hydration.
 */
export async function getServerLocale(): Promise<Locale> {
  const { getCookie } = await import("@tanstack/react-start/server");
  const cookie = getCookie("NEXT_LOCALE");
  return cookie === "en" ? "en" : "id";
}

export async function getServerT(namespace: string) {
  return i18n.getFixedT(await getServerLocale(), namespace);
}
