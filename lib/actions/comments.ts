'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createComment(postId: string, content: string) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  if (!content || content.trim().length < 2) {
    return { success: false, error: 'Comment too short' }
  }

  const { error } = await supabase.from('comments').insert({
    post_id: postId,
    user_id: authData.user.id,
    content: content.trim(),
  })

  if (error) {
    return { success: false, error: 'Failed to add comment' }
  }

  revalidatePath(`/blog`)
  return { success: true }
}

export async function reportComment(commentId: string, reason: string) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { error } = await supabase.from('blog_reports').insert({
    comment_id: commentId,
    reporter_id: authData.user.id,
    reason,
  })

  if (error) {
    return { success: false, error: 'Failed to report comment' }
  }

  return { success: true }
}

export async function getComments(postId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .select(
      `
      id,
      content,
      created_at,
      user:users!comments_user_id_fkey(id, display_name, avatar_url)
    `,
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) {
    return []
  }

  return data
}
