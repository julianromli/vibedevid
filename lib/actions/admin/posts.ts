'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// IMPORTANT-5: Role constants for maintainability
const ROLES = {
  ADMIN: 0,
  MODERATOR: 1,
  USER: 2,
} as const

// IMPORTANT-7: Extract hardcoded page size to constant
const DEFAULT_PAGE_SIZE = 20

export interface AdminPost {
  id: string
  slug: string
  title: string
  content: object
  excerpt: string | null
  cover_image: string | null
  status: 'draft' | 'published' | 'archived'
  featured: boolean
  view_count: number
  read_time_minutes: number | null
  published_at: string | null
  created_at: string
  updated_at: string
  author_id: string
  author: {
    username: string
    display_name: string
    avatar_url: string | null
  }
  tags: string[]
}

export interface GetAllPostsResult {
  posts: AdminPost[]
  totalCount: number
  error?: string
}

export interface PostFilters {
  status?: 'all' | 'draft' | 'published' | 'archived'
  authorId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  featured?: boolean
}

export interface Tag {
  id: string
  name: string
  slug: string
  created_at: string
}

async function checkAdminAccess() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (!userData || userData.role !== ROLES.ADMIN) {
    throw new Error('Admin access required')
  }

  return user
}

// CRITICAL-2: Sanitize search input to prevent SQL injection via ilike patterns
function sanitizeSearchInput(search: string): string {
  // Escape special SQL LIKE characters: % (wildcard) and _ (single char match)
  return search.replace(/[%_]/g, '\\$&')
}

export async function getAllPosts(
  filters: PostFilters = {},
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<GetAllPostsResult> {
  try {
    await checkAdminAccess()

    const supabase = await createClient()

    let query = supabase.from('posts').select(
      `
        *,
        users:author_id (
          username,
          display_name,
          avatar_url
        ),
        blog_post_tags (
          post_tags (
            id,
            name,
            slug
          )
        )
      `,
      { count: 'exact' },
    )

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.authorId) {
      query = query.eq('author_id', filters.authorId)
    }

    if (filters.featured !== undefined) {
      query = query.eq('featured', filters.featured)
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    if (filters.search) {
      // CRITICAL-2: Sanitize search to prevent SQL injection
      const sanitized = sanitizeSearchInput(filters.search)
      query = query.or(`title.ilike.%${sanitized}%,excerpt.ilike.%${sanitized}%`)
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data: posts, error, count } = await query

    if (error) {
      console.error('Get all posts error:', error)
      return { posts: [], totalCount: 0, error: error.message }
    }

    const formattedPosts: AdminPost[] = (posts || []).map((post) => {
      const tags =
        post.blog_post_tags?.map((pt: { post_tags: { name: string } }) => pt.post_tags?.name).filter(Boolean) || []

      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        cover_image: post.cover_image,
        status: post.status,
        featured: post.featured || false,
        view_count: post.view_count || 0,
        read_time_minutes: post.read_time_minutes,
        published_at: post.published_at,
        created_at: post.created_at,
        updated_at: post.updated_at,
        author_id: post.author_id,
        author: post.users || {
          username: 'unknown',
          display_name: 'Unknown',
          avatar_url: null,
        },
        tags,
      }
    })

    return {
      posts: formattedPosts,
      totalCount: count || 0,
    }
  } catch (error) {
    console.error('Get all posts error:', error)
    return {
      posts: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : 'Failed to load posts',
    }
  }
}

export async function adminUpdatePost(
  postId: string,
  updates: Partial<AdminPost>,
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess()

    const supabase = createAdminClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.excerpt !== undefined) updateData.excerpt = updates.excerpt
    if (updates.cover_image !== undefined) updateData.cover_image = updates.cover_image
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.featured !== undefined) updateData.featured = updates.featured
    if (updates.read_time_minutes !== undefined) updateData.read_time_minutes = updates.read_time_minutes
    if (updates.content !== undefined) updateData.content = updates.content

    // Handle published_at when status changes to published
    if (updates.status === 'published') {
      const { data: currentPost } = await supabase.from('posts').select('published_at').eq('id', postId).single()

      if (!currentPost?.published_at) {
        updateData.published_at = new Date().toISOString()
      }
    }

    const { data: updatedRows, error } = await supabase.from('posts').update(updateData).eq('id', postId).select('id')

    if (error) {
      console.error('Admin update post error:', error)
      return { success: false, error: error.message }
    }
    if (!updatedRows || updatedRows.length === 0) {
      return { success: false, error: 'Post not found or no changes applied' }
    }

    // Update tags if provided
    if (updates.tags !== undefined) {
      await updatePostTags(postId, updates.tags)
    }

    revalidatePath('/blog/[slug]')
    revalidatePath('/blog')
    revalidatePath('/admin/dashboard/boards/blog')

    return { success: true }
  } catch (error) {
    console.error('Admin update post error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update post',
    }
  }
}

async function updatePostTags(postId: string, tagNames: string[]) {
  const supabase = createAdminClient()

  // Remove existing tags
  await supabase.from('blog_post_tags').delete().eq('post_id', postId)

  if (tagNames.length === 0) return

  // Get or create tags
  const tagIds: string[] = []

  for (const tagName of tagNames) {
    const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    // Try to find existing tag
    const { data: existingTag } = await supabase.from('post_tags').select('id').eq('slug', slug).single()

    if (existingTag) {
      tagIds.push(existingTag.id)
    } else {
      // Create new tag
      const { data: newTag, error } = await supabase
        .from('post_tags')
        .insert({ name: tagName, slug })
        .select('id')
        .single()

      if (newTag) {
        tagIds.push(newTag.id)
      }
    }
  }

  // Insert new tag relationships
  if (tagIds.length > 0) {
    const tagRelations = tagIds.map((tagId) => ({
      post_id: postId,
      tag_id: tagId,
    }))

    await supabase.from('blog_post_tags').insert(tagRelations)
  }
}

export async function adminDeletePost(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess()

    const supabase = createAdminClient()

    // Delete the post first to avoid partial child-only deletion states.
    const { data: deletedRows, error } = await supabase.from('posts').delete().eq('id', postId).select('id')

    if (error) {
      console.error('Admin delete post error:', error)
      return { success: false, error: error.message }
    }
    if (!deletedRows || deletedRows.length === 0) {
      return { success: false, error: 'Post could not be deleted' }
    }

    // Best-effort cleanup for tables that may store post_id without strict FK cascade.
    const cleanupResults = await Promise.all([
      supabase.from('comments').delete().eq('post_id', postId),
      supabase.from('likes').delete().eq('post_id', postId),
      supabase.from('views').delete().eq('post_id', postId),
      supabase.from('blog_post_tags').delete().eq('post_id', postId),
    ])

    const cleanupTargets = ['comments', 'likes', 'views', 'blog_post_tags'] as const
    cleanupResults.forEach((result, index) => {
      if (result.error) {
        console.error(`Admin delete post cleanup warning (${cleanupTargets[index]}):`, {
          postId,
          message: result.error.message,
          code: result.error.code,
          details: result.error.details,
        })
      }
    })

    revalidatePath('/blog')
    revalidatePath('/admin/dashboard/boards/blog')

    return { success: true }
  } catch (error) {
    console.error('Admin delete post error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete post',
    }
  }
}

export async function togglePostFeatured(
  postId: string,
  featured: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess()

    const supabase = createAdminClient()

    const { data: updatedRows, error } = await supabase
      .from('posts')
      .update({ featured, updated_at: new Date().toISOString() })
      .eq('id', postId)
      .select('id')

    if (error) {
      console.error('Toggle post featured error:', error)
      return { success: false, error: error.message }
    }
    if (!updatedRows || updatedRows.length === 0) {
      return { success: false, error: 'Post not found' }
    }

    revalidatePath('/blog')
    revalidatePath('/admin/dashboard/boards/blog')

    return { success: true }
  } catch (error) {
    console.error('Toggle post featured error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle featured status',
    }
  }
}

export async function getAllTags(): Promise<{ tags: Tag[]; error?: string }> {
  try {
    await checkAdminAccess()

    const supabase = await createClient()

    const { data: tags, error } = await supabase.from('post_tags').select('*').order('name')

    if (error) {
      return { tags: [], error: error.message }
    }

    return { tags: tags || [] }
  } catch (error) {
    return {
      tags: [],
      error: error instanceof Error ? error.message : 'Failed to load tags',
    }
  }
}

export async function createTag(name: string): Promise<{ success: boolean; tag?: Tag; error?: string }> {
  try {
    await checkAdminAccess()

    const supabase = createAdminClient()

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const { data: tag, error } = await supabase.from('post_tags').insert({ name, slug }).select().single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Tag already exists' }
      }
      return { success: false, error: error.message }
    }

    return { success: true, tag }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create tag',
    }
  }
}

export async function deleteTag(tagId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess()

    const supabase = createAdminClient()

    // Delete tag relationships first
    const { error: relationDeleteError } = await supabase.from('blog_post_tags').delete().eq('tag_id', tagId)
    if (relationDeleteError) {
      return { success: false, error: relationDeleteError.message }
    }

    // Delete the tag
    const { data: deletedRows, error } = await supabase.from('post_tags').delete().eq('id', tagId).select('id')

    if (error) {
      return { success: false, error: error.message }
    }
    if (!deletedRows || deletedRows.length === 0) {
      return { success: false, error: 'Tag not found' }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete tag',
    }
  }
}
