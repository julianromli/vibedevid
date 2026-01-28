'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCategoryDisplayName } from './categories'
import { getSupabaseConfig } from './env-config'
import { fetchFavicon } from './favicon-utils'
import { ensureUniqueSlug, getProjectIdBySlug, slugifyTitle } from './slug'

async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseConfig()
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

function getSafeRedirectPath(value: FormDataEntryValue | null): string {
  if (typeof value !== 'string') return '/'

  const trimmed = value.trim()
  if (!trimmed.startsWith('/')) return '/'
  if (trimmed.startsWith('//')) return '/'

  return trimmed
}

export async function signIn(prevState: any, formData: FormData) {
  console.log('[Server Action] signIn called')

  if (!formData) {
    return { error: 'Form data is missing' }
  }

  const email = formData.get('email')
  const password = formData.get('password')
  const redirectTo = getSafeRedirectPath(formData.get('redirectTo'))

  console.log('[Server Action] signIn with email:', email)

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    // Get user and check email confirmation status
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      console.log('[Server Action] User found:', {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
      })

      // Check if email is confirmed
      if (!user.email_confirmed_at) {
        console.log('[Server Action] Email not confirmed, signing out and returning error')
        // Sign out the user since email is not confirmed
        await supabase.auth.signOut()
        return {
          error: 'Please confirm your email address before signing in. Check your inbox for the confirmation link.',
          emailNotConfirmed: true,
        }
      }

      console.log('[Server Action] Email confirmed, proceeding with profile creation')

      const { data: existingProfile } = await supabase.from('users').select('id').eq('id', user.id).single()

      if (!existingProfile) {
        const baseUsername =
          user.email
            ?.split('@')[0]
            ?.toLowerCase()
            .replace(/[^a-z0-9]/g, '') || `user${user.id.slice(0, 8)}`

        let username = baseUsername
        let attempts = 0
        const maxAttempts = 5

        while (attempts < maxAttempts) {
          const { data: usernameTaken } = await supabase.from('users').select('id').eq('username', username).single()

          if (!usernameTaken) break

          attempts++
          username = `${baseUsername}${attempts}`
        }

        if (attempts >= maxAttempts) {
          username = `${baseUsername}${Math.floor(Math.random() * 1000)}`
        }

        const profileData = {
          id: user.id,
          username,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          updated_at: new Date().toISOString(),
        }

        const { error: profileError } = await supabase.from('users').insert(profileData)

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }
      }
    }

    return { success: 'Login successful', redirect: redirectTo }
  } catch (error) {
    console.error('Login error:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function signUp(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: 'Form data is missing' }
  }

  const email = formData.get('email')
  const password = formData.get('password')
  const firstName = formData.get('firstName')
  const lastName = formData.get('lastName')

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}`,
        data: {
          full_name: firstName && lastName ? `${firstName} ${lastName}`.trim() : email.toString().split('@')[0],
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    return { success: 'Check your email to confirm your account.' }
  } catch (error) {
    console.error('Sign up error:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function signOut() {
  const supabase = await createClient()

  await supabase.auth.signOut()
  redirect('/')
}

export async function resetPassword(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: 'Form data is missing' }
  }

  const email = formData.get('email')

  if (!email) {
    return { error: 'Email is required' }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.toString(), {
      redirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/user/auth`,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: 'Password reset email sent. Check your inbox.' }
  } catch (error) {
    console.error('Password reset error:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function resendConfirmationEmail(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: 'Form data is missing' }
  }

  const email = formData.get('email')

  if (!email) {
    return { error: 'Email is required' }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.toString(),
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}`,
      },
    })

    if (error) {
      return { error: error.message }
    }

    return { success: 'Confirmation email sent. Check your inbox.' }
  } catch (error) {
    console.error('Resend confirmation error:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

// NOTE: Comment functions have been moved to @/lib/actions/comments.ts
// Use createComment, getComments, reportComment from there instead

export async function getProjectBySlug(slug: string) {
  const supabase = await createClient()

  try {
    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      return { project: null, error: 'Project slug is required' }
    }

    // Enhanced analytics queries with unique views counting
    const [
      { data: project, error: projectError },
      projectForCounts, // Get project ID for subsequent queries
    ] = await Promise.all([
      supabase
        .from('projects')
        .select(
          `
          *,
          users:author_id (
            username,
            display_name,
            avatar_url,
            role,
            bio,
            location
          )
        `,
        )
        .eq('slug', slug.trim())
        .single(),
      supabase.from('projects').select('id').eq('slug', slug.trim()).single(),
    ])

    if (projectError) {
      console.error('Get project by slug error:', projectError)
      return { project: null, error: projectError.message }
    }

    if (!project?.users) {
      console.error('Get project error: Author not found')
      return { project: null, error: 'Project author not found' }
    }

    // Use project.id (UUID/string) directly without parseInt
    const projectPk = project.id

    // Run analytics queries in parallel
    const [{ count: likesCount }, { count: totalViews }, { count: uniqueViews }, { count: todayViews }] =
      await Promise.all([
        supabase.from('likes').select('*', { count: 'exact', head: true }).eq('project_id', projectPk),
        supabase.from('views').select('*', { count: 'exact', head: true }).eq('project_id', projectPk),
        supabase
          .from('views')
          .select('session_id', { count: 'exact', head: true })
          .eq('project_id', projectPk)
          .not('session_id', 'is', null),
        supabase
          .from('views')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectPk)
          .eq('view_date', new Date().toISOString().split('T')[0]),
      ])

    // Get the display name for the category
    const categoryDisplayName = await getCategoryDisplayName(project.category)

    const formattedProject = {
      id: project.id,
      slug: project.slug, // Add slug to returned object
      title: project.title,
      description: project.description,
      fullDescription: project.description, // Use same description for now
      image: project.image_url,
      author: {
        name: project.users.display_name,
        username: project.users.username,
        role: project.users.role ?? null,
        avatar: project.users.avatar_url || '/placeholder.svg',
        bio: project.users.bio || 'Community member',
        location: project.users.location || 'Unknown location',
      },
      url: project.website_url,
      category: categoryDisplayName, // Use display name for UI display
      categoryRaw: project.category, // Keep raw category name for edit forms
      tagline: project.tagline || '',
      faviconUrl: project.favicon_url || '/default-favicon.svg',
      tags: project.tags || [], // Use actual tags from database
      likes: likesCount || 0,
      views: totalViews || 0,
      uniqueViews: uniqueViews || 0,
      todayViews: todayViews || 0,
      createdAt: project.created_at,
    }

    return { project: formattedProject, error: null }
  } catch (error) {
    console.error('Get project by slug error:', error)
    return { project: null, error: 'Failed to load project' }
  }
}

// Legacy function for backward compatibility (will be removed after migration)
export async function getProject(projectId: string) {
  console.warn('[DEPRECATED] getProject() is deprecated. Use getProjectBySlug() instead.')

  // For backward compatibility during migration phase
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.from('projects').select('slug').eq('id', projectId).single()

    if (error || !data?.slug) {
      return { project: null, error: 'Project not found' }
    }

    return getProjectBySlug(data.slug)
  } catch (error) {
    console.error('Legacy getProject error:', error)
    return { project: null, error: 'Failed to load project' }
  }
}

export async function incrementProjectViews(projectSlug: string, sessionId?: string) {
  if (!projectSlug || typeof projectSlug !== 'string' || projectSlug.trim() === '') {
    console.error('[Server] incrementProjectViews: projectSlug is required')
    return
  }

  // Resolve project ID from slug
  const projectId = await getProjectIdBySlug(projectSlug.trim())
  if (!projectId) {
    console.error('[Server] incrementProjectViews: Project not found for slug:', projectSlug)
    return
  }

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  try {
    // Prepare view record with session-based tracking
    const viewRecord = {
      project_id: projectId, // Use UUID directly, no parseInt
      user_id: session?.user?.id || null,
      session_id: sessionId || null,
      ip_address: null, // We'll skip IP tracking for now
      view_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    }

    console.log('[Server] Incrementing view for project slug:', projectSlug, 'ID:', projectId, 'Session:', sessionId)

    // Try to insert first
    const { data, error } = await supabase.from('views').insert(viewRecord).select()

    if (error) {
      // If it's a duplicate key error, that's expected (user already viewed in this session)
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        console.log('[Server] View already tracked for this session')
      } else {
        console.error('[Server] Increment views error:', error)
      }
    } else {
      console.log('[Server] View tracked successfully:', data)
    }
  } catch (error) {
    console.error('[Server] Increment views error:', error)
  }
}

export async function incrementBlogPostViews(postId: string, sessionId?: string) {
  if (!postId || typeof postId !== 'string' || postId.trim() === '') {
    console.error('[Server] incrementBlogPostViews: postId is required')
    return
  }

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  try {
    // Prepare view record with session-based tracking
    const viewRecord = {
      post_id: postId.trim(),
      user_id: session?.user?.id || null,
      session_id: sessionId || null,
      ip_address: null,
      view_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    }

    console.log('[Server] Incrementing view for blog post:', postId, 'Session:', sessionId)

    // Try to insert first
    const { data, error } = await supabase.from('views').insert(viewRecord).select()

    if (error) {
      // If it's a duplicate key error, that's expected (user already viewed in this session)
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        console.log('[Server] Blog view already tracked for this session')
      } else {
        console.error('[Server] Increment blog views error:', error)
      }
    } else {
      console.log('[Server] Blog view tracked successfully:', data)
    }
  } catch (error) {
    console.error('[Server] Increment blog views error:', error)
  }
}

export async function toggleLike(projectId: string) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return { error: 'You must be logged in to like projects' }
  }

  if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
    return { error: 'Project ID is required' }
  }

  try {
    // Use UUID directly, no parseInt
    const { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('project_id', projectId.trim())
      .eq('user_id', session.user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return { error: checkError.message }
    }

    if (existingLike) {
      const { error: deleteError } = await supabase.from('likes').delete().eq('id', existingLike.id)

      if (deleteError) {
        return { error: deleteError.message }
      }

      return { success: true, isLiked: false }
    } else {
      const { error: insertError } = await supabase.from('likes').insert({
        project_id: projectId.trim(), // Use UUID directly
        user_id: session.user.id,
      })

      if (insertError) {
        return { error: insertError.message }
      }

      return { success: true, isLiked: true }
    }
  } catch (error) {
    console.error('Toggle like error:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function getLikeStatus(projectId: string) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  try {
    if (!projectId || typeof projectId !== 'string' || projectId.trim() === '') {
      console.error('Get like status error: projectId is required')
      return { totalLikes: 0, isLiked: false, error: 'Project ID is required' }
    }

    // Use UUID directly, no parseInt
    const cleanProjectId = projectId.trim()

    const { count: totalLikes, error: countError } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', cleanProjectId)

    if (countError) {
      console.error('Get likes count error:', countError.message, countError.details)
      return { totalLikes: 0, isLiked: false, error: countError.message }
    }

    let isLiked = false
    if (session?.user) {
      const { data: userLike, error: userLikeError } = await supabase
        .from('likes')
        .select('id')
        .eq('project_id', cleanProjectId)
        .eq('user_id', session.user.id)
        .single()

      if (userLikeError && userLikeError.code !== 'PGRST116') {
        console.error('Get user like status error:', userLikeError.message, userLikeError.details)
      } else if (userLike) {
        isLiked = true
      }
    }

    return { totalLikes: totalLikes || 0, isLiked, error: null }
  } catch (error) {
    console.error('Get like status error:', error)
    return {
      totalLikes: 0,
      isLiked: false,
      error: 'Failed to load like status',
    }
  }
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    console.error('Google sign in error:', error)
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signInWithGitHub() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    console.error('GitHub sign in error:', error)
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function getBatchLikeStatus(projectIds: string[]) {
  const supabase = await createClient()

  try {
    if (!projectIds || projectIds.length === 0) {
      console.log('[v0] getBatchLikeStatus: No project IDs provided')
      return { likesData: {}, error: null }
    }

    // Convert integers to strings properly
    const cleanProjectIds = projectIds
      .filter((id) => id !== null && id !== undefined && String(id).trim() !== '')
      .map((id) => String(id).trim())

    if (cleanProjectIds.length === 0) {
      console.log('[v0] getBatchLikeStatus: No valid project IDs after cleaning')
      return { likesData: {}, error: 'No valid project IDs provided' }
    }

    console.log('[v0] getBatchLikeStatus: Fetching likes for projects:', cleanProjectIds)

    // Get session safely
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('[v0] getBatchLikeStatus: Session error:', sessionError)
      // Continue without session - we can still get total likes
    }

    console.log('[v0] getBatchLikeStatus: Session status:', session ? 'logged in' : 'anonymous')

    // Get all likes for these projects in one query
    const { data: allLikes, error: likesError } = await supabase
      .from('likes')
      .select('project_id, user_id')
      .in('project_id', cleanProjectIds)

    if (likesError) {
      console.error('[v0] getBatchLikeStatus: Likes fetch error:', likesError)
      // Return empty data instead of error to not break UI
      const emptyLikesData: Record<string, { totalLikes: number; isLiked: boolean }> = {}
      cleanProjectIds.forEach((projectId) => {
        emptyLikesData[projectId] = { totalLikes: 0, isLiked: false }
      })
      return { likesData: emptyLikesData, error: null }
    }

    console.log('[v0] getBatchLikeStatus: Raw likes data:', allLikes?.length || 0, 'likes found')

    // Process the data
    const likesData: Record<string, { totalLikes: number; isLiked: boolean }> = {}

    cleanProjectIds.forEach((projectId) => {
      // Convert projectId string to number for comparison since database returns integers
      const projectIdNum = parseInt(projectId)
      const projectLikes = allLikes?.filter((like) => like.project_id === projectIdNum) || []
      const totalLikes = projectLikes.length
      const isLiked = session?.user ? projectLikes.some((like) => like.user_id === session.user.id) : false

      // Store using original string key for consistency
      likesData[projectId] = { totalLikes, isLiked }
    })

    console.log('[v0] getBatchLikeStatus: Processed likes data:', likesData)
    return { likesData, error: null }
  } catch (error) {
    console.error('[v0] getBatchLikeStatus: Unexpected error:', error)
    // Return safe fallback data to prevent UI breaks
    const fallbackLikesData: Record<string, { totalLikes: number; isLiked: boolean }> = {}
    if (projectIds && projectIds.length > 0) {
      projectIds.forEach((id) => {
        const projectIdStr = id.toString()
        if (projectIdStr && projectIdStr.trim() !== '') {
          fallbackLikesData[projectIdStr] = { totalLikes: 0, isLiked: false }
        }
      })
    }
    return { likesData: fallbackLikesData, error: null }
  }
}

export async function submitProject(formData: FormData, userId: string) {
  const supabase = await createClient()

  try {
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const websiteUrl = formData.get('website_url') as string
    const imageUrl = formData.get('image_url') as string
    const tagline = formData.get('tagline') as string
    const tagsString = formData.get('tags') as string

    // Parse tags from JSON string to array
    let tags: string[] = []
    if (tagsString) {
      try {
        tags = JSON.parse(tagsString)
      } catch (e) {
        console.warn('Failed to parse tags, using empty array', e)
      }
    }

    // Auto-fetch favicon if website URL is provided
    let faviconUrl = '/default-favicon.svg'
    if (websiteUrl?.trim()) {
      try {
        faviconUrl = await fetchFavicon(websiteUrl.trim())
      } catch (e) {
        console.warn('Failed to fetch favicon, using default', e)
      }
    }

    if (!title || !description || !category) {
      return {
        success: false,
        error: 'Title, description, and category are required',
      }
    }

    // Generate slug from title
    const baseSlug = slugifyTitle(title.trim())
    const slug = await ensureUniqueSlug(baseSlug)

    console.log('[Submit Project] Generated slug:', slug, 'from title:', title.trim())

    // Query public.users table to get the correct public.users.id for the authenticated user
    const { data: profile } = await supabase.from('users').select('id').eq('id', userId).single()

    const publicUserId = profile?.id || userId

    console.log('[Submit Project] Auth userId:', userId)
    console.log('[Submit Project] Public users ID:', publicUserId)
    console.log('[Submit Project] Using userId for project:', publicUserId)

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title: title.trim(),
        description: description.trim(),
        category,
        website_url: websiteUrl?.trim() || null,
        image_url: imageUrl?.trim() || null,
        tagline: tagline?.trim() || null,
        favicon_url: faviconUrl,
        author_id: publicUserId,
        tags: tags,
        slug: slug, // Add slug column
      })
      .select('slug')
      .single()

    if (error) {
      console.error('Submit project error:', error)

      // Handle unique constraint violation (collision during race condition)
      if (error.code === '23505' && error.message?.includes('slug')) {
        console.log('[Submit Project] Slug collision detected, retrying...')

        // Retry with incremented slug
        try {
          const retrySlug = await ensureUniqueSlug(baseSlug)
          const { data: retryProject, error: retryError } = await supabase
            .from('projects')
            .insert({
              title: title.trim(),
              description: description.trim(),
              category,
              website_url: websiteUrl?.trim() || null,
              image_url: imageUrl?.trim() || null,
              tagline: tagline?.trim() || null,
              favicon_url: faviconUrl,
              author_id: userId,
              tags: tags,
              slug: retrySlug,
            })
            .select('slug')
            .single()

          if (retryError) {
            console.error('Submit project retry error:', retryError)
            return { success: false, error: retryError.message }
          }

          return { success: true, slug: retryProject.slug }
        } catch (retryErr) {
          console.error('Submit project retry failed:', retryErr)
          return {
            success: false,
            error: 'An unexpected error occurred',
          }
        }
      }
    }

    return { success: true, slug: project?.slug || slug }
  } catch (error) {
    console.error('Submit project error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function editProject(projectSlug: string, formData: FormData) {
  if (!projectSlug || typeof projectSlug !== 'string' || projectSlug.trim() === '') {
    return { success: false, error: 'Project slug is required' }
  }

  // Resolve project ID from slug
  const projectId = await getProjectIdBySlug(projectSlug.trim())
  if (!projectId) {
    return { success: false, error: 'Project not found' }
  }

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return { success: false, error: 'You must be logged in to edit projects' }
  }

  try {
    // First check if user owns this project
    const { data: project, error: checkError } = await supabase
      .from('projects')
      .select('author_id')
      .eq('id', projectId) // Use UUID directly, no parseInt
      .single()

    if (checkError) {
      return { success: false, error: 'Project not found' }
    }

    if (project.author_id !== session.user.id) {
      return { success: false, error: 'You can only edit your own projects' }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const websiteUrl = formData.get('website_url') as string
    const imageUrl = formData.get('image_url') as string
    const tagline = formData.get('tagline') as string
    const tagsString = formData.get('tags') as string

    // Parse tags from JSON string to array
    let tags: string[] = []
    if (tagsString) {
      try {
        tags = JSON.parse(tagsString)
      } catch (e) {
        console.warn('Failed to parse tags, using empty array', e)
      }
    }

    // Auto-fetch favicon if website URL changed
    let faviconUrl: string | undefined
    if (websiteUrl?.trim()) {
      try {
        faviconUrl = await fetchFavicon(websiteUrl.trim())
      } catch (e) {
        console.warn('Failed to fetch favicon, keeping existing', e)
      }
    }

    if (!title || !description || !category) {
      return {
        success: false,
        error: 'Title, description, and category are required',
      }
    }

    // Note: Don't auto-update slug when title changes (slug stays stable for SEO)
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        title: title.trim(),
        description: description.trim(),
        category,
        website_url: websiteUrl?.trim() || null,
        image_url: imageUrl?.trim() || null,
        tagline: tagline?.trim() || null,
        ...(faviconUrl && { favicon_url: faviconUrl }),
        tags: tags,
        updated_at: new Date().toISOString(),
        // Slug remains unchanged for stability
      })
      .eq('id', projectId) // Use UUID directly, no parseInt

    if (updateError) {
      console.error('Edit project error:', updateError)
      return { success: false, error: updateError.message }
    }

    return { success: true, slug: projectSlug } // Return slug instead of projectId
  } catch (error) {
    console.error('Edit project error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function fetchProjectsWithSorting(
  sortBy: 'trending' | 'top' | 'newest' = 'newest',
  category?: string,
  limit: number = 20,
) {
  const supabase = await createClient()

  try {
    let query = supabase.from('projects').select(`
        *,
        users!author_id (
          username,
          display_name,
          avatar_url,
          role
        )
      `)

    // Apply category filter if specified
    if (category && category !== 'All') {
      // For now, we'll filter client-side since we need to handle display name conversion
      // The category parameter here should be the display name from the filter
      // We'll filter after fetching to handle the display name conversion properly
    }

    // Apply sorting based on sortBy parameter
    switch (sortBy) {
      case 'trending':
        // For trending: projects with most likes in the last 7 days
        // We'll approximate by recent likes using a subquery approach
        // For now, let's sort by created_at desc and likes (we'll improve this)
        query = query.order('created_at', { ascending: false })
        break

      case 'top':
        // For top: we'll need to join with likes count
        // For now, let's sort by created_at desc and we'll add likes count after
        query = query.order('created_at', { ascending: false })
        break

      case 'newest':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    query = query.limit(limit)

    const { data: projectsWithUsers, error } = await query

    if (error) {
      console.error('[fetchProjectsWithSorting] Error fetching projects:', error)
      return { projects: [], error: error.message }
    }

    if (!projectsWithUsers || projectsWithUsers.length === 0) {
      return { projects: [], error: null }
    }

    // Get likes count for all projects in parallel
    const projectIds = projectsWithUsers.map((p) => p.id)
    const { likesData, error: likesError } = await getBatchLikeStatus(projectIds)

    if (likesError) {
      console.error('[fetchProjectsWithSorting] Error fetching likes:', likesError)
      // Continue without likes data
    }

    // Format projects with all required data
    const formattedProjects = await Promise.all(
      projectsWithUsers.map(async (project) => {
        // Get display name for category
        const categoryDisplayName = await getCategoryDisplayName(project.category)

        const projectLikesData = (likesData && likesData[project.id]) || {
          totalLikes: 0,
          isLiked: false,
        }

        return {
          id: project.id,
          slug: project.slug,
          title: project.title,
          description: project.description,
          image: project.image_url,
          author: {
            name: project.users?.display_name || 'Unknown',
            username: project.users?.username || 'unknown',
            role: project.users?.role ?? null,
            avatar: project.users?.avatar_url || '/vibedev-guest-avatar.png',
          },
          url: project.website_url,
          category: categoryDisplayName,
          likes: projectLikesData.totalLikes,
          views: 0, // We'll add views later if needed
          createdAt: project.created_at,
        }
      }),
    )

    // Apply category filter after formatting (client-side filtering)
    let filteredProjects = formattedProjects
    if (category && category !== 'All') {
      filteredProjects = formattedProjects.filter((project) => project.category === category)
    }

    // Apply post-processing sorting based on likes for trending and top
    const sortedProjects = [...filteredProjects]

    if (sortBy === 'trending' || sortBy === 'top') {
      // Sort by likes descending, then by creation date for tie-breaking
      sortedProjects.sort((a, b) => {
        if (b.likes !== a.likes) {
          return b.likes - a.likes
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

      // For trending, we could add more sophisticated logic here
      // like weighing recent likes more heavily, but for now this works
    }

    console.log(
      `[fetchProjectsWithSorting] Fetched ${sortedProjects.length} projects with sorting: ${sortBy}, category: ${category || 'All'}`,
    )

    return { projects: sortedProjects, error: null }
  } catch (error) {
    console.error('[fetchProjectsWithSorting] Unexpected error:', error)
    return { projects: [], error: 'Failed to fetch projects' }
  }
}

export async function deleteProject(projectSlug: string) {
  if (!projectSlug || typeof projectSlug !== 'string' || projectSlug.trim() === '') {
    return { success: false, error: 'Project slug is required' }
  }

  // Resolve project ID from slug
  const projectId = await getProjectIdBySlug(projectSlug.trim())
  if (!projectId) {
    return { success: false, error: 'Project not found' }
  }

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return { success: false, error: 'You must be logged in to delete projects' }
  }

  try {
    // First check if user owns this project
    const { data: project, error: checkError } = await supabase
      .from('projects')
      .select('author_id')
      .eq('id', projectId) // Use UUID directly, no parseInt
      .single()

    if (checkError) {
      return { success: false, error: 'Project not found' }
    }

    if (project.author_id !== session.user.id) {
      return { success: false, error: 'You can only delete your own projects' }
    }

    // Delete related records first (comments, likes, views) - CASCADE should handle this automatically
    // But we'll do it explicitly for safety
    await Promise.all([
      supabase
        .from('comments')
        .delete()
        .eq('project_id', projectId), // Use UUID directly
      supabase
        .from('likes')
        .delete()
        .eq('project_id', projectId), // Use UUID directly
      supabase
        .from('views')
        .delete()
        .eq('project_id', projectId), // Use UUID directly
    ])

    // Then delete the project
    const { error: deleteError } = await supabase.from('projects').delete().eq('id', projectId) // Use UUID directly, no parseInt

    if (deleteError) {
      console.error('Delete project error:', deleteError)
      return { success: false, error: deleteError.message }
    }

    console.log('[Delete Project] Successfully deleted project with slug:', projectSlug)
    return { success: true }
  } catch (error) {
    console.error('Delete project error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
