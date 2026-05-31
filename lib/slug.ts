import { createClient } from './supabase/server'

/**
 * Generate SEO-friendly slug dari title
 */
export function slugifyTitle(input: string, maxLen: number = 80): string {
  let base = input.trim().toLowerCase()
  base = base.replace(/[^a-z0-9\s]/g, '')
  base = base.replace(/\s+/g, '-')
  base = base.replace(/^-+|-+$/g, '')

  if (base.length > maxLen) {
    base = base.slice(0, maxLen).replace(/-+$/g, '')
  }

  return base || 'project'
}

export async function ensureUniqueSlug(baseSlug: string, excludeProjectId?: string): Promise<string> {
  const supabase = await createClient()
  let slug = baseSlug
  let i = 1

  while (true) {
    try {
      const { data, error } = await supabase.from('projects').select('id').eq('slug', slug).limit(1)

      if (error) {
        console.error('Error checking slug uniqueness:', error)
        break
      }

      const exists = data && data.length > 0
      const isExcluded = exists && excludeProjectId && data[0]?.id === excludeProjectId

      if (!exists || isExcluded) {
        return slug
      }

      i += 1
      slug = `${baseSlug}-${i}`

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

export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(slug) && slug.length > 0 && slug.length <= 100
}

export async function getProjectIdBySlug(slug: string): Promise<string | null> {
  if (!slug || !isValidSlug(slug)) {
    return null
  }

  const supabase = await createClient()

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

export type SlugGenerationOptions = {
  maxLength?: number
  excludeProjectId?: string
}
