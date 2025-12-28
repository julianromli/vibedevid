'use server'

import { revalidatePath } from 'next/cache'
import { slugifyTitle } from '@/lib/slug'
import { createClient } from '@/lib/supabase/server'

export async function createBlogPost(data: {
  title: string
  content: Record<string, any>
  excerpt?: string
  cover_image?: string
  status?: 'published' | 'draft'
}) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  if (!data.title || data.title.length < 5) {
    return { success: false, error: 'Title must be at least 5 characters' }
  }

  // Allow shorter content for drafts
  const minLength = data.status === 'draft' ? 10 : 100
  if (!data.content || JSON.stringify(data.content).length < minLength) {
    return { success: false, error: 'Content is too short' }
  }

  const baseSlug = slugifyTitle(data.title)
  const { data: existing } = await supabase.from('posts').select('slug').like('slug', `${baseSlug}%`)

  let slug = baseSlug
  if (existing?.some((p: { slug: string }) => p.slug === slug)) {
    slug = `${baseSlug}-${Date.now().toString(36)}`
  }

  const readTime = Math.ceil(JSON.stringify(data.content).split(' ').length / 200)

  const { error } = await supabase.from('posts').insert({
    title: data.title,
    slug,
    content: data.content,
    excerpt: data.excerpt,
    cover_image: data.cover_image,
    author_id: authData.user.id,
    read_time_minutes: readTime,
    status: data.status || 'published',
    published_at: data.status === 'published' ? new Date().toISOString() : null,
  })

  if (error) {
    console.error('Create post error:', error)
    return { success: false, error: 'Failed to create post' }
  }

  revalidatePath('/blog')
  revalidatePath('/dashboard/posts')
  return { success: true, slug }
}

export async function updateBlogPost(
  id: string,
  data: Partial<{
    title: string
    content: Record<string, any>
    excerpt: string
    cover_image: string
    status: 'published' | 'draft' | 'archived'
  }>,
) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: post } = await supabase.from('posts').select('author_id, status').eq('id', id).single()

  if (!post || post.author_id !== authData.user.id) {
    return { success: false, error: 'Not authorized' }
  }

  const updateData: any = { ...data, updated_at: new Date().toISOString() }

  if (data.title) {
    updateData.slug = slugifyTitle(data.title)
  }

  if (data.content) {
    updateData.read_time_minutes = Math.ceil(JSON.stringify(data.content).split(' ').length / 200)
  }

  // Handle publishing status change
  if (data.status === 'published' && post.status !== 'published') {
    updateData.published_at = new Date().toISOString()
  }

  const { error } = await supabase.from('posts').update(updateData).eq('id', id)

  if (error) {
    return { success: false, error: 'Failed to update post' }
  }

  revalidatePath('/blog')
  revalidatePath(`/blog/${id}`)
  revalidatePath('/dashboard/posts')
  return { success: true }
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

export async function getPostForEdit(id: string) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data, error } = await supabase.from('posts').select('*').eq('id', id).single()

  if (error || !data) {
    return { success: false, error: 'Post not found' }
  }

  if (data.author_id !== authData.user.id) {
    return { success: false, error: 'Not authorized' }
  }

  return { success: true, data }
}

export async function deleteBlogPost(id: string) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: post } = await supabase.from('posts').select('author_id, status').eq('id', id).single()

  if (!post) {
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
