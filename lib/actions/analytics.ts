'use server'

import { createClient } from '@/lib/supabase/server'

export interface PlatformStats {
  total_users: number
  total_projects: number
  total_posts: number
  total_comments: number
  total_likes: number
  total_views: number
  new_users_today: number
  new_projects_today: number
  new_posts_today: number
}

export interface TrendingItem {
  id: string | number
  title: string
  views: number
  likes: number
  author: string
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

export async function getPlatformStats(): Promise<{
  success: boolean
  stats?: PlatformStats
  error?: string
}> {
  try {
    await checkAdminAccess()

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    const [
      usersResult,
      projectsResult,
      postsResult,
      commentsResult,
      likesResult,
      viewsResult,
      newUsersToday,
      newProjectsToday,
      newPostsToday,
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('likes').select('*', { count: 'exact', head: true }),
      supabase.from('views').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('joined_at', today),
      supabase.from('projects').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', today),
    ])

    return {
      success: true,
      stats: {
        total_users: usersResult.count || 0,
        total_projects: projectsResult.count || 0,
        total_posts: postsResult.count || 0,
        total_comments: commentsResult.count || 0,
        total_likes: likesResult.count || 0,
        total_views: viewsResult.count || 0,
        new_users_today: newUsersToday.count || 0,
        new_projects_today: newProjectsToday.count || 0,
        new_posts_today: newPostsToday.count || 0,
      },
    }
  } catch (error) {
    console.error('Get platform stats error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load platform stats',
    }
  }
}

export async function getMostViewedProjects(limit: number = 10): Promise<{
  success: boolean
  projects?: TrendingItem[]
  error?: string
}> {
  try {
    await checkAdminAccess()

    const supabase = await createClient()

    const { data: projects, error } = await supabase
      .from('projects')
      .select(
        `
        id,
        title,
        slug,
        created_at,
        users:author_id (
          display_name
        )
      `,
      )
      .order('created_at', { ascending: false })
      .limit(100) // Get recent projects first

    if (error) {
      return { success: false, error: error.message }
    }

    // Get views and likes for each project
    const projectIds = projects?.map((p) => p.id) || []

    const [viewsResult, likesResult] = await Promise.all([
      supabase.from('views').select('project_id').in('project_id', projectIds),
      supabase.from('likes').select('project_id').in('project_id', projectIds),
    ])

    // Count views and likes per project
    const viewsCount: Record<number, number> = {}
    const likesCount: Record<number, number> = {}

    viewsResult.data?.forEach((view) => {
      if (view.project_id) {
        viewsCount[view.project_id] = (viewsCount[view.project_id] || 0) + 1
      }
    })

    likesResult.data?.forEach((like) => {
      if (like.project_id) {
        likesCount[like.project_id] = (likesCount[like.project_id] || 0) + 1
      }
    })

    // Format and sort by views
    const formattedProjects: TrendingItem[] = (projects || []).map((project: { id: number; title: string; created_at: string; users: { display_name: string }[] | null }) => ({
      id: project.id,
      title: project.title,
      views: viewsCount[project.id] || 0,
      likes: likesCount[project.id] || 0,
      author: project.users?.[0]?.display_name || 'Unknown',
      created_at: project.created_at,
    }))

    // Sort by views and take top N
    formattedProjects.sort((a, b) => b.views - a.views)

    return {
      success: true,
      projects: formattedProjects.slice(0, limit),
    }
  } catch (error) {
    console.error('Get most viewed projects error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load projects',
    }
  }
}

export async function getMostViewedPosts(limit: number = 10): Promise<{
  success: boolean
  posts?: TrendingItem[]
  error?: string
}> {
  try {
    await checkAdminAccess()

    const supabase = await createClient()

    const { data: posts, error } = await supabase
      .from('posts')
      .select(
        `
        id,
        title,
        slug,
        view_count,
        created_at,
        users:author_id (
          display_name
        )
      `,
      )
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error) {
      return { success: false, error: error.message }
    }

    // Get likes for each post
    const postIds = posts?.map((p) => p.id) || []

    const { data: likes } = await supabase.from('likes').select('post_id').in('post_id', postIds)

    // Count likes per post
    const likesCount: Record<string, number> = {}
    likes?.forEach((like) => {
      if (like.post_id) {
        likesCount[like.post_id] = (likesCount[like.post_id] || 0) + 1
      }
    })

    const formattedPosts: TrendingItem[] = (posts || []).map((post) => {
      const users = (post as { users?: { display_name: string }[] }).users
      return {
        id: post.id,
        title: post.title,
        views: post.view_count || 0,
        likes: likesCount[post.id] || 0,
        author: users?.[0]?.display_name || 'Unknown',
        created_at: post.created_at,
      }
    })

    return {
      success: true,
      posts: formattedPosts,
    }
  } catch (error) {
    console.error('Get most viewed posts error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load posts',
    }
  }
}

export async function getAnalyticsTimeSeries(days: number = 30): Promise<{
  success: boolean
  data?: {
    dates: string[]
    views: number[]
    likes: number[]
    comments: number[]
  }
  error?: string
}> {
  try {
    await checkAdminAccess()

    const supabase = await createClient()

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: views, error: viewsError } = await supabase
      .from('views')
      .select('view_date')
      .gte('view_date', startDate.toISOString().split('T')[0])
      .lte('view_date', endDate.toISOString().split('T')[0])

    if (viewsError) {
      return { success: false, error: viewsError.message }
    }

    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('created_at')
      .gte('created_at', startDate.toISOString())

    if (likesError) {
      return { success: false, error: likesError.message }
    }

    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('created_at')
      .gte('created_at', startDate.toISOString())

    if (commentsError) {
      return { success: false, error: commentsError.message }
    }

    // Group by date
    const dateMap = new Map<string, { views: number; likes: number; comments: number }>()

    // Initialize all dates
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      dateMap.set(dateStr, { views: 0, likes: 0, comments: 0 })
    }

    // Count views per date
    views?.forEach((view) => {
      if (view.view_date) {
        const current = dateMap.get(view.view_date) || { views: 0, likes: 0, comments: 0 }
        current.views++
        dateMap.set(view.view_date, current)
      }
    })

    // Count likes per date
    likes?.forEach((like) => {
      if (like.created_at) {
        const dateStr = like.created_at.split('T')[0]
        const current = dateMap.get(dateStr) || { views: 0, likes: 0, comments: 0 }
        current.likes++
        dateMap.set(dateStr, current)
      }
    })

    // Count comments per date
    comments?.forEach((comment) => {
      if (comment.created_at) {
        const dateStr = comment.created_at.split('T')[0]
        const current = dateMap.get(dateStr) || { views: 0, likes: 0, comments: 0 }
        current.comments++
        dateMap.set(dateStr, current)
      }
    })

    // Sort by date
    const sortedDates = Array.from(dateMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))

    return {
      success: true,
      data: {
        dates: sortedDates.map(([date]) => date),
        views: sortedDates.map(([, data]) => data.views),
        likes: sortedDates.map(([, data]) => data.likes),
        comments: sortedDates.map(([, data]) => data.comments),
      },
    }
  } catch (error) {
    console.error('Get analytics time series error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load analytics',
    }
  }
}
