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

export interface ReportedComment {
  id: string
  comment_id: string
  reporter_id: string
  reason: string
  status: 'pending' | 'reviewed' | 'dismissed'
  created_at: string
  comment: {
    id: string
    content: string
    created_at: string
    user_id: string | null
    author_name: string | null
    author: {
      id: string
      display_name: string
      avatar_url: string | null
    } | null
    isGuest: boolean
  }
  reporter: {
    id: string
    display_name: string
    username: string
  }
  entity_type: 'post' | 'project'
  entity_id: string
  entity_title: string
}

export interface GetReportedCommentsResult {
  reports: ReportedComment[]
  totalCount: number
  error?: string
}

export interface ReportFilters {
  status?: 'all' | 'pending' | 'reviewed' | 'dismissed'
  dateFrom?: string
  dateTo?: string
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

export async function getReportedComments(
  filters: ReportFilters = {},
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<GetReportedCommentsResult> {
  try {
    await checkAdminAccess()

    const supabase = await createClient()

    let query = supabase.from('blog_reports').select(
      `
        *,
        comment:comment_id (
          id,
          content,
          created_at,
          user_id,
          author_name,
          users:user_id (
            id,
            display_name,
            avatar_url
          )
        ),
        reporter:reporter_id (
          id,
          display_name,
          username
        )
      `,
      { count: 'exact' },
    )

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data: reports, error, count } = await query

    if (error) {
      console.error('Get reported comments error:', error)
      return { reports: [], totalCount: 0, error: error.message }
    }

    // IMPORTANT-2: Optimize N+1 query issue by batching lookups
    // Get all comment IDs from reports to batch fetch entity info
    const commentIds = (reports || []).map((r) => r.comment_id).filter(Boolean)

    // Batch fetch all comments with their post_id and project_id in a single query
    const { data: allComments } = await supabase.from('comments').select('id, post_id, project_id').in('id', commentIds)

    // Separate comment IDs by entity type
    const postCommentIds: string[] = []
    const projectCommentIds: number[] = []
    const commentEntityMap = new Map<string, { type: 'post' | 'project'; entityId: string }>()

    allComments?.forEach((comment) => {
      if (comment.post_id) {
        postCommentIds.push(comment.id)
        commentEntityMap.set(comment.id, {
          type: 'post',
          entityId: comment.post_id,
        })
      } else if (comment.project_id) {
        projectCommentIds.push(comment.project_id)
        commentEntityMap.set(comment.id, {
          type: 'project',
          entityId: String(comment.project_id),
        })
      }
    })

    // Batch fetch all posts and projects in parallel
    const [postsResult, projectsResult] = await Promise.all([
      postCommentIds.length > 0
        ? supabase.from('posts').select('id, title').in('id', postCommentIds)
        : Promise.resolve({ data: [] }),
      projectCommentIds.length > 0
        ? supabase.from('projects').select('id, title').in('id', projectCommentIds)
        : Promise.resolve({ data: [] }),
    ])

    // Create lookup maps for O(1) access
    const postMap = new Map<string, string>(
      (postsResult.data || []).map((p: { id: string; title: string }) => [p.id, p.title]),
    )
    const projectMap = new Map<number, string>(
      (projectsResult.data || []).map((p: { id: number; title: string }) => [p.id, p.title]),
    )

    // Format reports using the lookup maps (no additional queries)
    const formattedReports: ReportedComment[] = (reports || []).map((report) => {
      const entityInfo = commentEntityMap.get(report.comment_id)
      let entity_type: 'post' | 'project' = 'post'
      let entity_id = ''
      let entity_title = 'Unknown'

      if (entityInfo) {
        entity_type = entityInfo.type
        entity_id = entityInfo.entityId
        entity_title =
          entityInfo.type === 'post'
            ? postMap.get(entityInfo.entityId) || 'Unknown Post'
            : projectMap.get(Number(entityInfo.entityId)) || 'Unknown Project'
      }

      const comment = report.comment

      return {
        id: report.id,
        comment_id: report.comment_id,
        reporter_id: report.reporter_id,
        reason: report.reason,
        status: report.status,
        created_at: report.created_at,
        comment: {
          id: comment?.id || '',
          content: comment?.content || '',
          created_at: comment?.created_at || '',
          user_id: comment?.user_id || null,
          author_name: comment?.author_name || null,
          author: comment?.users
            ? {
                id: comment.users.id,
                display_name: comment.users.display_name,
                avatar_url: comment.users.avatar_url,
              }
            : null,
          isGuest: false,
        },
        reporter: {
          id: report.reporter?.id || '',
          display_name: report.reporter?.display_name || 'Unknown',
          username: report.reporter?.username || 'unknown',
        },
        entity_type,
        entity_id,
        entity_title,
      }
    })

    return {
      reports: formattedReports,
      totalCount: count || 0,
    }
  } catch (error) {
    console.error('Get reported comments error:', error)
    return {
      reports: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : 'Failed to load reports',
    }
  }
}

export async function adminDeleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess()

    const supabase = createAdminClient()

    // Get comment info for revalidation
    const { data: comment } = await supabase.from('comments').select('post_id, project_id').eq('id', commentId).single()

    // Delete related reports first
    const { error: reportDeleteError } = await supabase.from('blog_reports').delete().eq('comment_id', commentId)
    if (reportDeleteError) {
      return { success: false, error: reportDeleteError.message }
    }

    // Delete the comment
    const { data: deletedRows, error } = await supabase.from('comments').delete().eq('id', commentId).select('id')

    if (error) {
      console.error('Admin delete comment error:', error)
      return { success: false, error: error.message }
    }
    if (!deletedRows || deletedRows.length === 0) {
      return { success: false, error: 'Comment could not be deleted' }
    }

    // Revalidate paths
    if (comment?.post_id) {
      revalidatePath('/blog/[slug]')
      revalidatePath('/blog')
    }
    if (comment?.project_id) {
      revalidatePath('/project/[slug]')
      revalidatePath('/project/list')
    }
    revalidatePath('/admin/dashboard/boards/comments')

    return { success: true }
  } catch (error) {
    console.error('Admin delete comment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete comment',
    }
  }
}

export async function dismissReport(reportId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess()

    const supabase = createAdminClient()

    const { data: updatedRows, error } = await supabase
      .from('blog_reports')
      .update({ status: 'dismissed' })
      .eq('id', reportId)
      .select('id')

    if (error) {
      console.error('Dismiss report error:', error)
      return { success: false, error: error.message }
    }
    if (!updatedRows || updatedRows.length === 0) {
      return { success: false, error: 'Report not found' }
    }

    revalidatePath('/admin/dashboard/boards/comments')

    return { success: true }
  } catch (error) {
    console.error('Dismiss report error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to dismiss report',
    }
  }
}

export async function takeActionOnReport(
  reportId: string,
  action: 'delete' | 'dismiss' | 'warn',
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess()

    const supabase = createAdminClient()

    // Get report details
    const { data: report } = await supabase.from('blog_reports').select('comment_id').eq('id', reportId).single()

    if (!report) {
      return { success: false, error: 'Report not found' }
    }

    if (action === 'delete') {
      // Delete comment and mark report as reviewed
      const result = await adminDeleteComment(report.comment_id)
      if (!result.success) {
        return result
      }

      // Mark report as reviewed
      const { data: updatedRows, error: reviewError } = await supabase
        .from('blog_reports')
        .update({ status: 'reviewed' })
        .eq('id', reportId)
        .select('id')
      if (reviewError) {
        return { success: false, error: reviewError.message }
      }
      if (!updatedRows || updatedRows.length === 0) {
        return { success: false, error: 'Report not found' }
      }
    } else if (action === 'dismiss') {
      return await dismissReport(reportId)
    } else if (action === 'warn') {
      // Mark as reviewed but keep comment
      const { data: updatedRows, error } = await supabase
        .from('blog_reports')
        .update({ status: 'reviewed' })
        .eq('id', reportId)
        .select('id')

      if (error) {
        return { success: false, error: error.message }
      }
      if (!updatedRows || updatedRows.length === 0) {
        return { success: false, error: 'Report not found' }
      }
    }

    revalidatePath('/admin/dashboard/boards/comments')

    return { success: true }
  } catch (error) {
    console.error('Take action on report error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to take action',
    }
  }
}

export async function getCommentModerationStats(): Promise<{
  success: boolean
  stats?: {
    total_reports: number
    pending_reports: number
    reviewed_reports: number
    dismissed_reports: number
  }
  error?: string
}> {
  try {
    await checkAdminAccess()

    const supabase = await createClient()

    const { data: reports, error } = await supabase.from('blog_reports').select('status')

    if (error) {
      return { success: false, error: error.message }
    }

    const stats = {
      total_reports: reports?.length || 0,
      pending_reports: reports?.filter((r) => r.status === 'pending').length || 0,
      reviewed_reports: reports?.filter((r) => r.status === 'reviewed').length || 0,
      dismissed_reports: reports?.filter((r) => r.status === 'dismissed').length || 0,
    }

    return { success: true, stats }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load stats',
    }
  }
}
