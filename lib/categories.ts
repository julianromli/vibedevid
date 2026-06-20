import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { toCategoryDto } from "@/lib/db/mappers";
import { categories } from "@/lib/db/schema";

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

let categoriesCache: Category[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export async function getCategories(): Promise<Category[]> {
  const now = Date.now();
  if (categoriesCache && now - cacheTimestamp < CACHE_DURATION) {
    return categoriesCache;
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder));

    categoriesCache = rows.map((row) => {
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
    cacheTimestamp = now;
    return categoriesCache;
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
