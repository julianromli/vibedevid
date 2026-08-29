import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { toCategoryDto } from "@/lib/db/mappers";
import { categories } from "@/lib/db/schema";
import { getCachedJson, setCachedJson, SHORT_TTL_CACHE_KEYS } from "@/lib/server/short-ttl-cache";

export interface Category {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
}

export async function getCategories(): Promise<Category[]> {
  const cached = await getCachedJson<Category[]>(SHORT_TTL_CACHE_KEYS.categories);
  if (cached) {
    return cached;
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder));

    const mapped = rows.map((row) => {
      const category = toCategoryDto(row);
      return {
        id: category.id,
        name: category.name,
        display_name: category.displayName,
        description: category.description ?? undefined,
        icon: category.icon ?? undefined,
        color: category.color ?? undefined,
        sort_order: category.sortOrder ?? 0,
        is_active: category.isActive ?? true,
      };
    });
    await setCachedJson(SHORT_TTL_CACHE_KEYS.categories, mapped);
    return mapped;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export async function getCategoryDisplayName(categoryName: string): Promise<string> {
  const allCategories = await getCategories();
  const category = allCategories.find((cat) => cat.name === categoryName);
  return category?.display_name || categoryName;
}

export const getCategoriesFn = createServerFn({ method: "GET" }).handler(async () =>
  getCategories(),
);
