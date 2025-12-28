'use server'

import { revalidatePath } from 'next/cache'
import { slugifyTitle } from '@/lib/slug'
import { createClient } from '@/lib/supabase/server'

function normalizeEditorContent(content: unknown): Record<string, any> {
  if (!content) return { type: 'doc', content: [] }

  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content)
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, any>
      }
    } catch {
      return { type: 'doc', content: [] }
    }
  }

  if (typeof content === 'object') {
    return content as Record<string, any>
  }

  return { type: 'doc', content: [] }
}

export async function createBlogPost(data: {
  title: string
  content: Record<string, any> | string
  excerpt?: string
  cover_image?: string
  status?: 'published' | 'draft'
  tags?: string[]
}) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  if (!data.title || data.title.length < 5) {
    return { success: false, error: 'Title must be at least 5 characters' }
  }

  const normalizedContent = normalizeEditorContent(data.content)

  // Allow shorter content for drafts
  const minLength = data.status === 'draft' ? 10 : 100
  const contentStr = JSON.stringify(normalizedContent)
  if (!normalizedContent || contentStr.length < minLength) {
    return { success: false, error: 'Content is too short' }
  }

  const baseSlug = slugifyTitle(data.title)
  const { data: existing } = await supabase.from('posts').select('slug').like('slug', `${baseSlug}%`)

  let slug = baseSlug
  if (existing?.some((p: { slug: string }) => p.slug === slug)) {
    slug = `${baseSlug}-${Date.now().toString(36)}`
  }

  const readTime = Math.ceil(contentStr.split(' ').length / 200)

  const insertData = {
    title: data.title,
    slug,
    content: normalizedContent,
    excerpt: data.excerpt,
    cover_image: data.cover_image,
    author_id: authData.user.id,
    read_time_minutes: readTime,
    status: data.status || 'published',
    published_at: data.status === 'published' ? new Date().toISOString() : null,
  }

  // Log content being saved to database
  console.log('[createBlogPost] Content to save:', JSON.stringify(normalizedContent, null, 2))

  const { data: post, error } = await supabase.from('posts').insert(insertData).select('id, slug').single()

  if (error || !post) {
    console.error('Create post error:', error)
    return { success: false, error: 'Failed to create post' }
  }

  // Handle Tags
  if (data.tags && data.tags.length > 0) {
    await syncPostTags(post.id, data.tags)
  }

  revalidatePath('/blog')
  revalidatePath('/dashboard/posts')
  return { success: true, slug }
}

export async function updateBlogPost(
  id: string,
  data: Partial<{
    title: string
    content: Record<string, any> | string
    excerpt: string
    cover_image: string
    status: 'published' | 'draft' | 'archived'
    tags: string[]
  }>,
) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('author_id, status, slug')
    .eq('id', id)
    .single()

  if (fetchError || !post) {
    console.error('Update fetch error:', fetchError)
    return { success: false, error: 'Post not found' }
  }

  if (post.author_id !== authData.user.id) {
    return { success: false, error: 'Not authorized' }
  }

  const { tags, ...updateDataRaw } = data
  const updateData: any = { ...updateDataRaw, updated_at: new Date().toISOString() }

  if (data.title) {
    updateData.slug = slugifyTitle(data.title)
  }

  if (typeof data.content !== 'undefined') {
    const normalizedContent = normalizeEditorContent(data.content)
    updateData.content = normalizedContent
    updateData.read_time_minutes = Math.ceil(JSON.stringify(normalizedContent).split(' ').length / 200)
  }

  // Handle publishing status change
  if (data.status === 'published' && post.status !== 'published') {
    updateData.published_at = new Date().toISOString()
  }

  const { error } = await supabase.from('posts').update(updateData).eq('id', id)

  if (error) {
    return { success: false, error: 'Failed to update post' }
  }

  // Handle Tags
  if (tags) {
    await syncPostTags(id, tags)
  }

  const finalSlug = updateData.slug || post.slug

  revalidatePath('/blog')
  revalidatePath(`/blog/${finalSlug}`)
  revalidatePath('/dashboard/posts')
  return { success: true, slug: finalSlug }
}

async function syncPostTags(postId: string, tagNames: string[]) {
  const supabase = await createClient()

  // 1. Get or create tag IDs
  const tagIds: string[] = []

  for (const name of tagNames) {
    const slug = slugifyTitle(name)
    // Upsert tag
    const { data: tag, error } = await supabase
      .from('post_tags')
      .upsert({ name, slug }, { onConflict: 'slug' })
      .select('id')
      .single()

    if (tag) tagIds.push(tag.id)
  }

  // 2. Delete existing links
  await supabase.from('blog_post_tags').delete().eq('post_id', postId)

  // 3. Insert new links
  if (tagIds.length > 0) {
    await supabase.from('blog_post_tags').insert(tagIds.map((tagId) => ({ post_id: postId, tag_id: tagId })))
  }
}

export async function getTags(query = '') {
  const supabase = await createClient()
  let q = supabase.from('post_tags').select('id, name, slug')

  if (query) {
    q = q.ilike('name', `%${query}%`)
  }

  const { data, error } = await q.limit(20)
  if (error) return []
  return data || []
}

export async function getAuthorPosts(page = 1, status: 'published' | 'draft' | 'archived' | 'all' = 'all') {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'Unauthorized', data: [], total: 0 }
  }

  const pageSize = 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('posts')
    .select('id, title, slug, status, created_at, published_at, view_count, excerpt, cover_image', { count: 'exact' })
    .eq('author_id', authData.user.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching author posts:', error)
    return { success: false, error: 'Failed to fetch posts', data: [], total: 0 }
  }

  return { success: true, data: data || [], total: count || 0 }
}

export async function getPostForEdit(slug: string) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('posts')
    .select('*, tags:blog_post_tags(post_tags(name))')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    return { success: false, error: 'Post not found' }
  }

  if (data.author_id !== authData.user.id) {
    return { success: false, error: 'Not authorized' }
  }

  // Flatten tags
  const tags = data.tags?.map((t: any) => t.post_tags?.name).filter(Boolean) || []

  return { success: true, data: { ...data, tags } }
}

export async function deleteBlogPost(id: string) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('author_id, status')
    .eq('id', id)
    .single()

  if (fetchError || !post) {
    return { success: false, error: 'Post not found' }
  }

  const isAuthor = post.author_id === authData.user.id
  const isAdmin = authData.user.user_metadata.role === 0

  if (!isAuthor && !isAdmin) {
    return { success: false, error: 'Not authorized' }
  }

  const { error } = await supabase.from('posts').delete().eq('id', id)

  if (error) {
    return { success: false, error: 'Failed to delete post' }
  }

  revalidatePath('/blog')
  return { success: true }
}
