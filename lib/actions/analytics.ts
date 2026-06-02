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

export interface ContentGrowthPoint {
  date: string
  users: number
  projects: number
  posts: number
}

export interface CategoryCount {
  category: string
  count: number
}

export interface RoleCount {
  role: 'admin' | 'moderator' | 'user'
  label: string
  count: number
}

export interface StatusCount {
  status: string
  label: string
  count: number
}

export interface CommunityHealthCounts {
  pending_events: number
  approved_events: number
  pending_reports: number
  featured_projects: number
  featured_posts: number
  suspended_users: number
}

function buildDateRange(days: number) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  return {
    startIso: startDate.toISOString(),
    startDateKey: startDate.toISOString().split('T')[0],
    endDateKey: endDate.toISOString().split('T')[0],
    days,
  }
}

function initDateMap(days: number, startDate: Date) {
  const dateMap = new Map<string, number>()
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    dateMap.set(date.toISOString().split('T')[0], 0)
  }
  return dateMap
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
    const formattedProjects: TrendingItem[] = (projects || []).map(
      (project: { id: number; title: string; created_at: string; users: { display_name: string }[] | null }) => ({
        id: project.id,
        title: project.title,
        views: viewsCount[project.id] || 0,
        likes: likesCount[project.id] || 0,
        author: project.users?.[0]?.display_name || 'Unknown',
        created_at: project.created_at,
      }),
    )

    // Sort by views and take top N
    formattedProjects.sort((a, b) => b.views - a.views)

    return {
      success: true,
      projects: formattedProjects.slice(0, limit),
    }
  } catch (error) {
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
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load posts',
    }
  }
}

export async function getContentGrowthTimeSeries(days: number = 30): Promise<{
  success: boolean
  data?: ContentGrowthPoint[]
  error?: string
}> {
  try {
    await checkAdminAccess()

    const supabase = await createClient()
    const { startIso, days: rangeDays, startDateKey } = buildDateRange(days)
    const startDate = new Date(startIso)

    const [usersResult, projectsResult, postsResult] = await Promise.all([
      supabase.from('users').select('joined_at').gte('joined_at', startIso),
      supabase.from('projects').select('created_at').gte('created_at', startIso),
      supabase.from('posts').select('created_at').gte('created_at', startIso),
    ])

    if (usersResult.error) return { success: false, error: usersResult.error.message }
    if (projectsResult.error) return { success: false, error: projectsResult.error.message }
    if (postsResult.error) return { success: false, error: postsResult.error.message }

    const usersByDate = initDateMap(rangeDays, startDate)
    const projectsByDate = initDateMap(rangeDays, startDate)
    const postsByDate = initDateMap(rangeDays, startDate)

    usersResult.data?.forEach((row) => {
      if (row.joined_at) {
        const key = row.joined_at.split('T')[0]
        if (usersByDate.has(key)) usersByDate.set(key, (usersByDate.get(key) || 0) + 1)
      }
    })

    projectsResult.data?.forEach((row) => {
      if (row.created_at) {
        const key = row.created_at.split('T')[0]
        if (projectsByDate.has(key)) projectsByDate.set(key, (projectsByDate.get(key) || 0) + 1)
      }
    })

    postsResult.data?.forEach((row) => {
      if (row.created_at) {
        const key = row.created_at.split('T')[0]
        if (postsByDate.has(key)) postsByDate.set(key, (postsByDate.get(key) || 0) + 1)
      }
    })

    const dates = Array.from(usersByDate.keys()).sort()
    const data: ContentGrowthPoint[] = dates
      .filter((date) => date >= startDateKey)
      .map((date) => ({
        date,
        users: usersByDate.get(date) || 0,
        projects: projectsByDate.get(date) || 0,
        posts: postsByDate.get(date) || 0,
      }))

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load content growth',
    }
  }
}

export async function getProjectsByCategory(limit: number = 8): Promise<{
  success: boolean
  categories?: CategoryCount[]
  error?: string
}> {
  try {
    await checkAdminAccess()

    const supabase = await createClient()
    const { data, error } = await supabase.from('projects').select('category')

    if (error) return { success: false, error: error.message }

    const counts = new Map<string, number>()
    data?.forEach((row) => {
      const category = row.category?.trim() || 'Uncategorized'
      counts.set(category, (counts.get(category) || 0) + 1)
    })

    const categories = Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    return { success: true, categories }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load project categories',
    }
  }
}

export async function getUsersByRole(): Promise<{
  success: boolean
  roles?: RoleCount[]
  error?: string
}> {
  try {
    await checkAdminAccess()

    const supabase = await createClient()
    const { data, error } = await supabase.from('users').select('role')

    if (error) return { success: false, error: error.message }

    const counts = { admin: 0, moderator: 0, user: 0 }
    data?.forEach((row) => {
      if (row.role === 0) counts.admin++
      else if (row.role === 1) counts.moderator++
      else counts.user++
    })

    return {
      success: true,
      roles: [
        { role: 'admin', label: 'Admin', count: counts.admin },
        { role: 'moderator', label: 'Moderator', count: counts.moderator },
        { role: 'user', label: 'User', count: counts.user },
      ],
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load user roles',
    }
  }
}

export async function getPostsByStatus(): Promise<{
  success: boolean
  statuses?: StatusCount[]
  error?: string
}> {
  try {
    await checkAdminAccess()

    const supabase = await createClient()

    const [draft, published, archived] = await Promise.all([
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'archived'),
    ])

    return {
      success: true,
      statuses: [
        { status: 'published', label: 'Published', count: published.count || 0 },
        { status: 'draft', label: 'Draft', count: draft.count || 0 },
        { status: 'archived', label: 'Archived', count: archived.count || 0 },
      ],
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load post statuses',
    }
  }
}

export async function getCommunityHealthCounts(): Promise<{
  success: boolean
  counts?: CommunityHealthCounts
  error?: string
}> {
  try {
    await checkAdminAccess()

    const supabase = await createClient()

    const [pendingEvents, approvedEvents, pendingReports, featuredProjects, featuredPosts, suspendedUsers] =
      await Promise.all([
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('approved', false),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('approved', true),
        supabase.from('blog_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('featured', true),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('featured', true),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_suspended', true),
      ])

    return {
      success: true,
      counts: {
        pending_events: pendingEvents.count || 0,
        approved_events: approvedEvents.count || 0,
        pending_reports: pendingReports.count || 0,
        featured_projects: featuredProjects.count || 0,
        featured_posts: featuredPosts.count || 0,
        suspended_users: suspendedUsers.count || 0,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load community health',
    }
  }
}

export async function getPeriodSignupStats(days: number = 30): Promise<{
  success: boolean
  new_users?: number
  new_projects?: number
  new_posts?: number
  error?: string
}> {
  try {
    await checkAdminAccess()

    const supabase = await createClient()
    const { startIso } = buildDateRange(days)

    const [users, projects, posts] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('joined_at', startIso),
      supabase.from('projects').select('*', { count: 'exact', head: true }).gte('created_at', startIso),
      supabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', startIso),
    ])

    return {
      success: true,
      new_users: users.count || 0,
      new_projects: projects.count || 0,
      new_posts: posts.count || 0,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load period stats',
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
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load analytics',
    }
  }
}
