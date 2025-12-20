'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { slugifyTitle } from '@/lib/slug'

export async function createBlogPost(data: {
  title: string
  content: Record<string, any>
  excerpt?: string
  cover_image?: string
}) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  if (!data.title || data.title.length < 5) {
    return { success: false, error: 'Title must be at least 5 characters' }
  }

  if (!data.content || JSON.stringify(data.content).length < 100) {
    return { success: false, error: 'Content is too short' }
  }

  const baseSlug = slugifyTitle(data.title)
  const { data: existing } = await supabase
    .from('posts')
    .select('slug')
    .like('slug', `${baseSlug}%`)

  let slug = baseSlug
  if (existing?.some((p: { slug: string }) => p.slug === slug)) {
    slug = `${baseSlug}-${Date.now().toString(36)}`
  }

  const readTime = Math.ceil(
    JSON.stringify(data.content).split(' ').length / 200,
  )

  const { error } = await supabase.from('posts').insert({
    title: data.title,
    slug,
    content: data.content,
    excerpt: data.excerpt,
    cover_image: data.cover_image,
    author_id: authData.user.id,
    read_time_minutes: readTime,
    status: 'published',
    published_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Create post error:', error)
    return { success: false, error: 'Failed to create post' }
  }

  revalidatePath('/blog')
  return { success: true, slug }
}

export async function updateBlogPost(
  id: string,
  data: Partial<{
    title: string
    content: Record<string, any>
    excerpt: string
    cover_image: string
  }>,
) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!post || post.author_id !== authData.user.id) {
    return { success: false, error: 'Not authorized' }
  }

  const updateData: any = { ...data, updated_at: new Date().toISOString() }

  if (data.title) {
    updateData.slug = slugifyTitle(data.title)
  }

  if (data.content) {
    updateData.read_time_minutes = Math.ceil(
      JSON.stringify(data.content).split(' ').length / 200,
    )
  }

  const { error } = await supabase.from('posts').update(updateData).eq('id', id)

  if (error) {
    return { success: false, error: 'Failed to update post' }
  }

  revalidatePath('/blog')
  revalidatePath(`/blog/${id}`)
  return { success: true }
}

export async function deleteBlogPost(id: string) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { data: post } = await supabase
    .from('posts')
    .select('author_id, status')
    .eq('id', id)
    .single()

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
