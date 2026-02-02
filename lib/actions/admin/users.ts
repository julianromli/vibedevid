'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// IMPORTANT-5: Role constants for maintainability
const ROLES = {
  ADMIN: 0,
  MODERATOR: 1,
  USER: 2,
} as const

// IMPORTANT-7: Extract hardcoded page size to constant
const DEFAULT_PAGE_SIZE = 20

export interface AdminUser {
  id: string
  username: string
  display_name: string
  email: string
  bio: string | null
  avatar_url: string | null
  location: string | null
  website: string | null
  github_url: string | null
  twitter_url: string | null
  role: number
  joined_at: string
  updated_at: string
  is_suspended: boolean
  stats: {
    projects_count: number
    posts_count: number
    comments_count: number
    likes_received: number
  }
}

export interface GetAllUsersResult {
  users: AdminUser[]
  totalCount: number
  error?: string
}

export interface UserFilters {
  search?: string
  role?: 'all' | 'admin' | 'moderator' | 'user'
  status?: 'all' | 'active' | 'suspended'
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

// CRITICAL-2: Sanitize search input to prevent SQL injection via ilike patterns
function sanitizeSearchInput(search: string): string {
  // Escape special SQL LIKE characters: % (wildcard) and _ (single char match)
  return search.replace(/[%_]/g, '\\$&')
}

export async function getAllUsers(
  filters: UserFilters = {},
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<GetAllUsersResult> {
  try {
    await checkAdminAccess()

    const supabase = await createClient()

    let query = supabase.from('users').select('*', { count: 'exact' })

    // Apply filters
    if (filters.role && filters.role !== 'all') {
      const roleMap: Record<string, number> = {
        admin: ROLES.ADMIN,
        moderator: ROLES.MODERATOR,
        user: ROLES.USER,
      }
      query = query.eq('role', roleMap[filters.role])
    }

    if (filters.status === 'suspended') {
      query = query.eq('is_suspended', true)
    } else if (filters.status === 'active') {
      query = query.eq('is_suspended', false).or('is_suspended.is.null')
    }

    if (filters.search) {
      // CRITICAL-2: Sanitize search to prevent SQL injection
      const sanitized = sanitizeSearchInput(filters.search)
      query = query.or(`username.ilike.%${sanitized}%,display_name.ilike.%${sanitized}%`)
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to).order('joined_at', { ascending: false })

    const { data: users, error, count } = await query

    if (error) {
      console.error('Get all users error:', error)
      return { users: [], totalCount: 0, error: error.message }
    }

    // Get user stats in parallel
    const userIds = users?.map((u) => u.id) || []

    const [projectsResult, postsResult, commentsResult, likesResult] = await Promise.all([
      supabase.from('projects').select('author_id').in('author_id', userIds),
      supabase.from('posts').select('author_id').in('author_id', userIds),
      supabase.from('comments').select('user_id').in('user_id', userIds),
      supabase.from('likes').select('user_id').in('user_id', userIds),
    ])

    // Count stats per user
    const projectsCount: Record<string, number> = {}
    const postsCount: Record<string, number> = {}
    const commentsCount: Record<string, number> = {}
    const likesCount: Record<string, number> = {}

    projectsResult.data?.forEach((project) => {
      projectsCount[project.author_id] = (projectsCount[project.author_id] || 0) + 1
    })

    postsResult.data?.forEach((post) => {
      postsCount[post.author_id] = (postsCount[post.author_id] || 0) + 1
    })

    commentsResult.data?.forEach((comment) => {
      if (comment.user_id) {
        commentsCount[comment.user_id] = (commentsCount[comment.user_id] || 0) + 1
      }
    })

    likesResult.data?.forEach((like) => {
      if (like.user_id) {
        likesCount[like.user_id] = (likesCount[like.user_id] || 0) + 1
      }
    })

    // Get email from auth.users
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const emailMap: Record<string, string> = {}
    authUsers?.users?.forEach((authUser) => {
      emailMap[authUser.id] = authUser.email || ''
    })

    const formattedUsers: AdminUser[] = (users || []).map((user) => ({
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      email: emailMap[user.id] || '',
      bio: user.bio,
      avatar_url: user.avatar_url,
      location: user.location,
      website: user.website,
      github_url: user.github_url,
      twitter_url: user.twitter_url,
      role: user.role || 2,
      joined_at: user.joined_at,
      updated_at: user.updated_at,
      is_suspended: user.is_suspended || false,
      stats: {
        projects_count: projectsCount[user.id] || 0,
        posts_count: postsCount[user.id] || 0,
        comments_count: commentsCount[user.id] || 0,
        likes_received: likesCount[user.id] || 0,
      },
    }))

    return {
      users: formattedUsers,
      totalCount: count || 0,
    }
  } catch (error) {
    console.error('Get all users error:', error)
    return {
      users: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : 'Failed to load users',
    }
  }
}

export async function updateUserRole(userId: string, role: number): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess()

    const supabase = await createClient()

    const { error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      console.error('Update user role error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/dashboard/boards/users')

    return { success: true }
  } catch (error) {
    console.error('Update user role error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user role',
    }
  }
}

export async function suspendUser(
  userId: string,
  suspended: boolean,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess()

    const supabase = await createClient()

    const { error } = await supabase
      .from('users')
      .update({
        is_suspended: suspended,
        suspension_reason: reason || null,
        suspended_at: suspended ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Suspend user error:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/dashboard/boards/users')

    return { success: true }
  } catch (error) {
    console.error('Suspend user error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user suspension status',
    }
  }
}

export async function getUserStats(userId: string): Promise<{
  success: boolean
  stats?: AdminUser['stats']
  error?: string
}> {
  try {
    await checkAdminAccess()

    const supabase = await createClient()

    const [projectsResult, postsResult, commentsResult, likesResult] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('author_id', userId),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', userId),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('likes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ])

    return {
      success: true,
      stats: {
        projects_count: projectsResult.count || 0,
        posts_count: postsResult.count || 0,
        comments_count: commentsResult.count || 0,
        likes_received: likesResult.count || 0,
      },
    }
  } catch (error) {
    console.error('Get user stats error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load user stats',
    }
  }
}
