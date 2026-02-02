'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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

  if (!userData || userData.role !== 0) {
    throw new Error('Admin access required')
  }

  return user
}

export async function getAllPosts(
  filters: PostFilters = {},
  page: number = 1,
  pageSize: number = 20,
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
      query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`)
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
        author: post.users || { username: 'unknown', display_name: 'Unknown', avatar_url: null },
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

    const supabase = await createClient()

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

    const { error } = await supabase.from('posts').update(updateData).eq('id', postId)

    if (error) {
      console.error('Admin update post error:', error)
      return { success: false, error: error.message }
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
  const supabase = await createClient()

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

    const supabase = await createClient()

    // Delete related records first
    await Promise.all([
      supabase.from('comments').delete().eq('post_id', postId),
      supabase.from('likes').delete().eq('post_id', postId),
      supabase.from('views').delete().eq('post_id', postId),
      supabase.from('blog_post_tags').delete().eq('post_id', postId),
    ])

    // Delete the post
    const { error } = await supabase.from('posts').delete().eq('id', postId)

    if (error) {
      console.error('Admin delete post error:', error)
      return { success: false, error: error.message }
    }

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

    const supabase = await createClient()

    const { error } = await supabase
      .from('posts')
      .update({ featured, updated_at: new Date().toISOString() })
      .eq('id', postId)

    if (error) {
      console.error('Toggle post featured error:', error)
      return { success: false, error: error.message }
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

    const supabase = await createClient()

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

    const supabase = await createClient()

    // Delete tag relationships first
    await supabase.from('blog_post_tags').delete().eq('tag_id', tagId)

    // Delete the tag
    const { error } = await supabase.from('post_tags').delete().eq('id', tagId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete tag',
    }
  }
}
