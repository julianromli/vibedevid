import { createClient } from "@/lib/supabase/client"

export interface Category {
  id: string
  name: string
  display_name: string
  description?: string
  icon?: string
  color?: string
  sort_order: number
  is_active: boolean
}

// Cache categories for performance
let categoriesCache: Category[] | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch all active categories from database
 * Uses caching to improve performance
 */
export async function getCategories(): Promise<Category[]> {
  // Check cache first
  const now = Date.now()
  if (categoriesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return categoriesCache
  }

  try {
    const supabase = createClient()
    
    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("Error fetching categories:", error)
      return []
    }

    // Update cache
    categoriesCache = categories || []
    cacheTimestamp = now

    return categories || []
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    return []
  }
}

/**
 * Get category display names for dropdown/select components
 */
export async function getCategoryOptions(): Promise<{ value: string; label: string }[]> {
  const categories = await getCategories()
  
  return [
    { value: "all", label: "All" },
    ...categories.map(category => ({
      value: category.name,
      label: category.display_name
    }))
  ]
}

/**
 * Get display name for a category by its name
 */
export async function getCategoryDisplayName(categoryName: string): Promise<string> {
  const categories = await getCategories()
  const category = categories.find(cat => cat.name === categoryName)
  return category?.display_name || categoryName
}

/**
 * Clear categories cache (useful after admin changes)
 */
export function clearCategoriesCache(): void {
  categoriesCache = null
  cacheTimestamp = 0
}

/**
 * Validate if a category name exists and is active
 */
export async function isValidCategory(categoryName: string): Promise<boolean> {
  const categories = await getCategories()
  return categories.some(cat => cat.name === categoryName)
}
