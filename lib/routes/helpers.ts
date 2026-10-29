import i18n from "@/i18n";
import { getServerLocale } from "@/lib/locale";
import type { SortBy } from "@/types/homepage";

export function getSingleSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeSortParam(value: string | undefined): SortBy {
  return value === "top" || value === "newest" || value === "trending" ? value : "newest";
}

export async function getServerT(namespace: string) {
  return i18n.getFixedT(await getServerLocale(), namespace);
}
