import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { cachedGet } from "@/lib/cache/cached";
import { CACHE_KEYS, CACHE_TTL } from "@/lib/cache/keys";
import staticCategories from "@/lib/data/static/categories.json";
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

function getStaticCategories(): Category[] {
  return staticCategories.map((category) => ({
    id: category.id,
    name: category.name,
    display_name: category.display_name,
    description: category.description,
    sort_order: category.sort_order,
    is_active: category.is_active,
  }));
}

async function loadCategoriesFromDb(): Promise<Category[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder));

  if (!rows.length) {
    return getStaticCategories();
  }

  return rows.map((row) => {
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
}

export async function getCategories(): Promise<Category[]> {
  try {
    return await cachedGet({
      key: CACHE_KEYS.categories,
      ttlSeconds: CACHE_TTL.categories,
      memoryTtlMs: CACHE_TTL.memoryCategoriesMs,
      loader: loadCategoriesFromDb,
      fallback: getStaticCategories,
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return getStaticCategories();
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
