'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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

  if (!userData || userData.role !== 0) {
    throw new Error('Admin access required')
  }

  return user
}

export async function getReportedComments(
  filters: ReportFilters = {},
  page: number = 1,
  pageSize: number = 20,
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

    // Get entity info (post or project) for each comment
    const formattedReports: ReportedComment[] = await Promise.all(
      (reports || []).map(async (report) => {
        let entity_type: 'post' | 'project' = 'post'
        let entity_id = ''
        let entity_title = ''

        // Check if comment belongs to a post or project
        const comment = report.comment
        if (comment) {
          // Check post_id first
          const { data: postComment } = await supabase
            .from('comments')
            .select('post_id')
            .eq('id', comment.id)
            .not('post_id', 'is', null)
            .single()

          if (postComment?.post_id) {
            entity_type = 'post'
            entity_id = postComment.post_id
            const { data: post } = await supabase.from('posts').select('title').eq('id', postComment.post_id).single()
            entity_title = post?.title || 'Unknown Post'
          } else {
            // Check project_id
            const { data: projectComment } = await supabase
              .from('comments')
              .select('project_id')
              .eq('id', comment.id)
              .not('project_id', 'is', null)
              .single()

            if (projectComment?.project_id) {
              entity_type = 'project'
              entity_id = String(projectComment.project_id)
              const { data: project } = await supabase
                .from('projects')
                .select('title')
                .eq('id', projectComment.project_id)
                .single()
              entity_title = project?.title || 'Unknown Project'
            }
          }
        }

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
      }),
    )

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

    const supabase = await createClient()

    // Get comment info for revalidation
    const { data: comment } = await supabase.from('comments').select('post_id, project_id').eq('id', commentId).single()

    // Delete related reports first
    await supabase.from('blog_reports').delete().eq('comment_id', commentId)

    // Delete the comment
    const { error } = await supabase.from('comments').delete().eq('id', commentId)

    if (error) {
      console.error('Admin delete comment error:', error)
      return { success: false, error: error.message }
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

    const supabase = await createClient()

    const { error } = await supabase.from('blog_reports').update({ status: 'dismissed' }).eq('id', reportId)

    if (error) {
      console.error('Dismiss report error:', error)
      return { success: false, error: error.message }
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

    const supabase = await createClient()

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
      await supabase.from('blog_reports').update({ status: 'reviewed' }).eq('id', reportId)
    } else if (action === 'dismiss') {
      return await dismissReport(reportId)
    } else if (action === 'warn') {
      // Mark as reviewed but keep comment
      const { error } = await supabase.from('blog_reports').update({ status: 'reviewed' }).eq('id', reportId)

      if (error) {
        return { success: false, error: error.message }
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
