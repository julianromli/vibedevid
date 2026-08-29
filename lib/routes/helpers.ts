import i18n from "@/i18n";
import type { SortBy } from "@/types/homepage";
import { getServerLocale as readServerLocale } from "@/lib/locale";

export function getSingleSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeSortParam(value: string | undefined): SortBy {
  return value === "top" || value === "newest" || value === "trending" ? value : "newest";
}

export { readServerLocale as getServerLocale };

export async function getServerT(namespace: string) {
  return i18n.getFixedT(await readServerLocale(), namespace);
}
