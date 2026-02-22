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

export interface AdminProject {
  id: number
  slug: string
  title: string
  description: string | null
  category: string
  website_url: string | null
  image_url: string | null
  tagline: string | null
  tags: string[]
  featured: boolean
  author_id: string
  author: {
    username: string
    display_name: string
    avatar_url: string | null
  }
  created_at: string
  updated_at: string
  likes_count: number
  views_count: number
  comments_count: number
}

export interface GetAllProjectsResult {
  projects: AdminProject[]
  totalCount: number
  error?: string
}

export interface ProjectFilters {
  status?: 'all' | 'featured' | 'regular'
  category?: string
  dateFrom?: string
  dateTo?: string
  search?: string
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

export async function getAllProjects(
  filters: ProjectFilters = {},
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<GetAllProjectsResult> {
  try {
    await checkAdminAccess()

    const supabase = await createClient()

    let query = supabase.from('projects').select(
      `
        *,
        users:author_id (
          username,
          display_name,
          avatar_url
        )
      `,
      { count: 'exact' },
    )

    // Apply filters
    if (filters.status === 'featured') {
      query = query.eq('featured', true)
    } else if (filters.status === 'regular') {
      query = query.eq('featured', false)
    }

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category)
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    if (filters.search) {
      // CRITICAL-2: Sanitize search to prevent SQL injection
      const sanitized = sanitizeSearchInput(filters.search)
      query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`)
    }

    // Pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data: projects, error, count } = await query

    if (error) {
      console.error('Get all projects error:', error)
      return { projects: [], totalCount: 0, error: error.message }
    }

    // Get analytics for each project
    const projectIds = projects?.map((p) => p.id) || []

    const [likesResult, viewsResult, commentsResult] = await Promise.all([
      supabase.from('likes').select('project_id').in('project_id', projectIds),
      supabase.from('views').select('project_id').in('project_id', projectIds),
      supabase.from('comments').select('project_id').in('project_id', projectIds),
    ])

    // Count analytics per project
    const likesCount: Record<number, number> = {}
    const viewsCount: Record<number, number> = {}
    const commentsCount: Record<number, number> = {}

    likesResult.data?.forEach((like) => {
      likesCount[like.project_id] = (likesCount[like.project_id] || 0) + 1
    })

    viewsResult.data?.forEach((view) => {
      viewsCount[view.project_id] = (viewsCount[view.project_id] || 0) + 1
    })

    commentsResult.data?.forEach((comment) => {
      commentsCount[comment.project_id] = (commentsCount[comment.project_id] || 0) + 1
    })

    const formattedProjects: AdminProject[] = (projects || []).map((project) => ({
      id: project.id,
      slug: project.slug,
      title: project.title,
      description: project.description,
      category: project.category,
      website_url: project.website_url,
      image_url: project.image_url,
      tagline: project.tagline,
      tags: project.tags || [],
      featured: project.featured || false,
      author_id: project.author_id,
      author: project.users || {
        username: 'unknown',
        display_name: 'Unknown',
        avatar_url: null,
      },
      created_at: project.created_at,
      updated_at: project.updated_at,
      likes_count: likesCount[project.id] || 0,
      views_count: viewsCount[project.id] || 0,
      comments_count: commentsCount[project.id] || 0,
    }))

    return {
      projects: formattedProjects,
      totalCount: count || 0,
    }
  } catch (error) {
    console.error('Get all projects error:', error)
    return {
      projects: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : 'Failed to load projects',
    }
  }
}

export async function adminUpdateProject(
  projectId: number,
  updates: Partial<AdminProject>,
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess()

    const supabase = createAdminClient()

    const { data: updatedRows, error } = await supabase
      .from('projects')
      .update({
        title: updates.title,
        description: updates.description,
        category: updates.category,
        website_url: updates.website_url,
        image_url: updates.image_url,
        tagline: updates.tagline,
        tags: updates.tags,
        featured: updates.featured,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select('id')

    if (error) {
      console.error('Admin update project error:', error)
      return { success: false, error: error.message }
    }
    if (!updatedRows || updatedRows.length === 0) {
      return {
        success: false,
        error: 'Project not found or no changes applied',
      }
    }

    revalidatePath('/project/[slug]')
    revalidatePath('/admin/dashboard/boards/projects')

    return { success: true }
  } catch (error) {
    console.error('Admin update project error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project',
    }
  }
}

export async function adminDeleteProject(projectId: number): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess()

    const supabase = createAdminClient()

    // Delete related records first
    const [commentsDelete, likesDelete, viewsDelete] = await Promise.all([
      supabase.from('comments').delete().eq('project_id', projectId),
      supabase.from('likes').delete().eq('project_id', projectId),
      supabase.from('views').delete().eq('project_id', projectId),
    ])
    if (commentsDelete.error || likesDelete.error || viewsDelete.error) {
      const deleteError = commentsDelete.error || likesDelete.error || viewsDelete.error || new Error('Unknown error')
      return { success: false, error: deleteError.message }
    }

    // Delete the project
    const { data: deletedRows, error } = await supabase.from('projects').delete().eq('id', projectId).select('id')

    if (error) {
      console.error('Admin delete project error:', error)
      return { success: false, error: error.message }
    }
    if (!deletedRows || deletedRows.length === 0) {
      return { success: false, error: 'Project could not be deleted' }
    }

    revalidatePath('/project/list')
    revalidatePath('/admin/dashboard/boards/projects')

    return { success: true }
  } catch (error) {
    console.error('Admin delete project error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project',
    }
  }
}

export async function toggleProjectFeatured(
  projectId: number,
  featured: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdminAccess()

    const supabase = createAdminClient()

    const { data: updatedRows, error } = await supabase
      .from('projects')
      .update({ featured, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .select('id')

    if (error) {
      console.error('Toggle project featured error:', error)
      return { success: false, error: error.message }
    }
    if (!updatedRows || updatedRows.length === 0) {
      return { success: false, error: 'Project not found' }
    }

    revalidatePath('/')
    revalidatePath('/admin/dashboard/boards/projects')

    return { success: true }
  } catch (error) {
    console.error('Toggle project featured error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle featured status',
    }
  }
}

export async function getProjectCategories(): Promise<{
  categories: string[]
  error?: string
}> {
  try {
    // CRITICAL-1: Add missing admin access check
    await checkAdminAccess()

    const supabase = await createClient()

    const { data, error } = await supabase.from('categories').select('name').eq('is_active', true).order('sort_order')

    if (error) {
      return { categories: [], error: error.message }
    }

    return { categories: data?.map((c) => c.name) || [] }
  } catch (error) {
    return {
      categories: [],
      error: error instanceof Error ? error.message : 'Failed to load categories',
    }
  }
}
