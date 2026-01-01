'use server'

import { revalidatePath } from 'next/cache'
import type { Comment, CommentEntityType, CommentResult, CreateCommentInput, GetCommentsResult } from '@/types/comments'
import { createClient } from '@/lib/supabase/server'

/**
 * Raw user data from Supabase join
 */
interface RawUser {
  id: string
  display_name: string
  avatar_url: string | null
  role: number | null
}

/**
 * Raw comment data from Supabase query
 */
interface RawComment {
  id: string
  content: string
  created_at: string
  user_id: string | null
  author_name: string | null
  users: RawUser | RawUser[] | null
}

/**
 * Extract user from Supabase join result (handles both single object and array)
 */
const extractUser = (users: RawUser | RawUser[] | null): RawUser | null => {
  if (!users) return null
  if (Array.isArray(users)) return users[0] ?? null
  return users
}

/**
 * Normalize raw comment data from Supabase to unified Comment type
 */
const normalizeComment = (raw: RawComment): Comment => {
  const user = extractUser(raw.users)

  return {
    id: raw.id,
    content: raw.content,
    createdAt: raw.created_at,
    isGuest: !raw.user_id,
    author: user
      ? {
          id: user.id,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          role: user.role,
        }
      : raw.author_name
        ? {
            id: 'guest',
            displayName: raw.author_name,
            avatarUrl: null,
            role: null,
          }
        : null,
  }
}

/**
 * Get revalidation path based on entity type
 */
const getRevalidatePath = (entityType: CommentEntityType): string => (entityType === 'post' ? '/blog' : '/project')

/**
 * Create a new comment for blog post or project
 * Supports both authenticated users and guest comments (when allowed)
 */
export async function createComment(input: CreateCommentInput): Promise<CommentResult> {
  const { entityType, entityId, content, guestName } = input

  if (!entityId || !content) {
    return { success: false, error: 'Entity ID and content are required' }
  }

  if (content.trim().length < 2) {
    return { success: false, error: 'Comment too short (minimum 2 characters)' }
  }

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  // Build insert data based on entity type
  const insertData: Record<string, unknown> = {
    content: content.trim(),
    user_id: authData.user?.id ?? null,
  }

  // Set the appropriate foreign key based on entity type
  if (entityType === 'post') {
    insertData.post_id = entityId
  } else {
    insertData.project_id = entityId
  }

  // Add guest name if not authenticated
  if (!authData.user && guestName) {
    insertData.author_name = guestName.trim()
  }

  const { error } = await supabase.from('comments').insert(insertData)

  if (error) {
    console.error('Create comment error:', error)
    return { success: false, error: 'Failed to add comment' }
  }

  revalidatePath(getRevalidatePath(entityType))
  return { success: true }
}

/**
 * Get comments for a blog post or project
 * Returns newest first for better UX
 */
export async function getComments(entityType: CommentEntityType, entityId: string): Promise<GetCommentsResult> {
  if (!entityId) {
    return { comments: [], error: 'Entity ID is required' }
  }

  const supabase = await createClient()

  // Build query with appropriate filter
  const filterColumn = entityType === 'post' ? 'post_id' : 'project_id'

  const { data, error } = await supabase
    .from('comments')
    .select(
      `
      id,
      content,
      created_at,
      user_id,
      author_name,
      users (
        id,
        display_name,
        avatar_url,
        role
      )
    `,
    )
    .eq(filterColumn, entityId)
    .order('created_at', { ascending: false }) // Newest first

  if (error) {
    console.error('Get comments error:', error)
    return { comments: [], error: 'Failed to load comments' }
  }

  const comments = (data ?? []).map((item) => normalizeComment(item as RawComment))
  return { comments }
}

/**
 * Report a comment for moderation
 * Requires authenticated user
 */
export async function reportComment(commentId: string, reason: string): Promise<CommentResult> {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    return { success: false, error: 'You must be logged in to report comments' }
  }

  if (!commentId || !reason) {
    return { success: false, error: 'Comment ID and reason are required' }
  }

  const { error } = await supabase.from('comment_reports').insert({
    comment_id: commentId,
    reporter_id: authData.user.id,
    reason: reason.trim(),
  })

  if (error) {
    // Check for duplicate report
    if (error.code === '23505') {
      return { success: false, error: 'You have already reported this comment' }
    }
    console.error('Report comment error:', error)
    return { success: false, error: 'Failed to report comment' }
  }

  return { success: true }
}
