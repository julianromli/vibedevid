import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseConfig } from './env-config'

/**
 * Generate SEO-friendly slug dari title
 * @param input - Input string (biasanya title)
 * @param maxLen - Maximum length untuk slug (default: 80)
 * @returns Clean slug yang SEO-friendly
 */
export function slugifyTitle(input: string, maxLen: number = 80): string {
  // Step 1: Clean dan normalize input
  let base = input.trim().toLowerCase()

  // Step 2: Remove special characters, keep only alphanumeric and spaces
  base = base.replace(/[^a-z0-9\s]/g, '')

  // Step 3: Replace multiple spaces with single dash
  base = base.replace(/\s+/g, '-')

  // Step 4: Remove leading/trailing dashes
  base = base.replace(/^-+|-+$/g, '')

  // Step 5: Limit length dan remove trailing dash
  if (base.length > maxLen) {
    base = base.slice(0, maxLen).replace(/-+$/g, '')
  }

  // Step 6: Fallback kalau kosong
  return base || 'project'
}

/**
 * Ensure slug unique di database dengan collision detection
 * @param baseSlug - Base slug yang mau dicek
 * @param excludeProjectId - Project ID yang mau di-exclude dari pengecekan (untuk edit)
 * @returns Unique slug (dengan suffix -2, -3, dst jika diperlukan)
 */
export async function ensureUniqueSlug(baseSlug: string, excludeProjectId?: string): Promise<string> {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseConfig()

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Component context, can be ignored
        }
      },
    },
  })

  let slug = baseSlug
  let i = 1

  // Loop sampai dapat unique slug
  while (true) {
    try {
      // Cek apakah slug sudah exist di database
      const { data, error } = await supabase.from('projects').select('id').eq('slug', slug).limit(1)

      if (error) {
        console.error('Error checking slug uniqueness:', error)
        break // Return slug yang ada kalau error
      }

      // Kalau tidak ada data, berarti slug unique
      const exists = data && data.length > 0
      const isExcluded = exists && excludeProjectId && data[0]?.id === excludeProjectId

      if (!exists || isExcluded) {
        return slug
      }

      // Kalau sudah exist, increment suffix
      i += 1
      slug = `${baseSlug}-${i}`

      // Safety break untuk avoid infinite loop
      if (i > 100) {
        console.warn('Slug collision detection exceeded 100 attempts')
        break
      }
    } catch (error) {
      console.error('Unexpected error in ensureUniqueSlug:', error)
      break
    }
  }

  return slug
}

/**
 * Validate slug format
 * @param slug - Slug yang mau divalidate
 * @returns true jika slug valid, false jika tidak
 */
export function isValidSlug(slug: string): boolean {
  // Check format: lowercase alphanumeric with dashes, no leading/trailing dashes
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(slug) && slug.length > 0 && slug.length <= 100
}

/**
 * Extract project ID dari slug menggunakan database lookup
 * @param slug - Project slug
 * @returns Project ID (string/UUID) atau null jika tidak ditemukan
 */
export async function getProjectIdBySlug(slug: string): Promise<string | null> {
  if (!slug || !isValidSlug(slug)) {
    return null
  }

  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseConfig()

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Component context, can be ignored
        }
      },
    },
  })

  try {
    const { data, error } = await supabase.from('projects').select('id').eq('slug', slug).single()

    if (error || !data) {
      return null
    }

    return data.id as string
  } catch (error) {
    console.error('Error getting project ID by slug:', error)
    return null
  }
}

// Export type untuk TypeScript
export type SlugGenerationOptions = {
  maxLength?: number
  excludeProjectId?: string
}
