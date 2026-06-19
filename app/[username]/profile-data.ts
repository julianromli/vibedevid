import { createClient } from '@/lib/supabase/server'

export interface ProfileUser {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  location: string | null
  website: string | null
  github_url: string | null
  x_url: string | null
  instagram_url: string | null
  threads_url: string | null
  twitter_url: string | null
  joined_at: string
  role?: number | null
}

export interface UserProject {
  id: string
  slug: string
  title: string
  description: string | null
  category: string | null
  website_url: string | null
  image_url: string | null
  thumbnail_url: string | null
  url: string | null
  author_id: string
  created_at: string
  updated_at: string | null
  likes: number
  views_count: number
  comments_count: number
}

interface BlogPostTag {
  post_tags: { name: string } | null
}

export interface UserBlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image: string | null
  published_at: string | null
  read_time_minutes: number | null
  tags?: BlogPostTag[]
}

export interface ProfileAuthUser {
  id: string
  name: string
  email: string
  avatar?: string
  avatar_url?: string
  username?: string
  role?: number | null
}

export interface ProfilePageData {
  user: ProfileUser | null
  currentUser: ProfileAuthUser | null
  isLoggedIn: boolean
  isOwner: boolean
  projects: UserProject[]
  posts: UserBlogPost[]
  stats: { projects: number; posts: number; likes: number; views: number }
}

function getPrimaryProjectImage(imageUrls: unknown, imageUrl: string | null | undefined): string | null {
  if (Array.isArray(imageUrls)) {
    const firstImageUrl = imageUrls.find((url): url is string => typeof url === 'string' && url.trim().length > 0)
    if (firstImageUrl) {
      return firstImageUrl
    }
  }
  return imageUrl || null
}

async function fetchUserProjectsFallback(username: string): Promise<UserProject[]> {
  const supabase = await createClient()

  const { data: user, error: userError } = await supabase.from('users').select('id').eq('username', username).single()
  if (userError || !user) return []

  const { data: projects, error } = await supabase
    .from('projects')
    .select(
      `id, slug, title, description, category, website_url, image_url, image_urls, author_id, created_at, updated_at`,
    )
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !projects?.length) return []

  const projectIds = projects.map((p) => p.id)
  const [likesData, viewsData, commentsData] = await Promise.all([
    supabase.from('likes').select('project_id').in('project_id', projectIds),
    supabase.from('views').select('project_id').in('project_id', projectIds),
    supabase.from('comments').select('project_id').in('project_id', projectIds),
  ])

  const tally = (rows: { project_id: number }[] | null | undefined) =>
    rows?.reduce<Record<number, number>>((acc, row) => {
      acc[row.project_id] = (acc[row.project_id] || 0) + 1
      return acc
    }, {}) ?? {}

  const likeCounts = tally(likesData.data)
  const viewCounts = tally(viewsData.data)
  const commentCounts = tally(commentsData.data)

  return projects.map((project) => ({
    ...project,
    image_url: getPrimaryProjectImage(project.image_urls, project.image_url),
    thumbnail_url: getPrimaryProjectImage(project.image_urls, project.image_url),
    url: project.website_url,
    likes: likeCounts[project.id] || 0,
    views_count: viewCounts[project.id] || 0,
    comments_count: commentCounts[project.id] || 0,
  }))
}

async function fetchUserProjects(username: string): Promise<UserProject[]> {
  const supabase = await createClient()

  const { data: projectsData, error } = await supabase.rpc('get_user_projects_with_stats', {
    username_param: username,
  })

  if (error) {
    return fetchUserProjectsFallback(username)
  }

  const projectIds = (projectsData || [])
    .map((project: Record<string, unknown>) => project.id as string)
    .filter(Boolean)
  const { data: projectImages } = projectIds.length
    ? await supabase.from('projects').select('id, image_url, image_urls').in('id', projectIds)
    : { data: [] }

  const projectImageMap = new Map(
    (projectImages || []).map((project) => [project.id, getPrimaryProjectImage(project.image_urls, project.image_url)]),
  )

  return (projectsData || []).map((project: Record<string, unknown>) => ({
    id: project.id as string,
    slug: project.slug as string,
    title: project.title as string,
    description: (project.description as string) || null,
    category: (project.category as string) || null,
    website_url: (project.website_url as string) || null,
    image_url: projectImageMap.get(project.id as string) || (project.image_url as string) || null,
    thumbnail_url: projectImageMap.get(project.id as string) || (project.image_url as string) || null,
    url: (project.website_url as string) || null,
    author_id: project.author_id as string,
    created_at: project.created_at as string,
    updated_at: (project.updated_at as string) || null,
    likes: (project.likes_count as number) || (project.likes as number) || 0,
    views_count: (project.views_count as number) || 0,
    comments_count: (project.comments_count as number) || 0,
  }))
}

async function fetchUserProfileWithStats(username: string) {
  const supabase = await createClient()

  const { data: user, error: userError } = await supabase.from('users').select('*').eq('username', username).single()
  if (userError || !user) {
    return { user: null as ProfileUser | null, stats: { projects: 0, likes: 0, views: 0 } }
  }

  const [projectsResult, projectsListResult, postsListResult] = await Promise.all([
    supabase.from('projects').select('id', { count: 'exact' }).eq('author_id', user.id),
    supabase.from('projects').select('id').eq('author_id', user.id),
    supabase.from('posts').select('id').eq('author_id', user.id).eq('status', 'published'),
  ])

  const projectCount = projectsResult.count || 0
  const projectIds = projectsListResult.data?.map((p) => p.id) || []
  const postIds = postsListResult.data?.map((p) => p.id) || []

  if (projectIds.length === 0 && postIds.length === 0) {
    return { user: user as ProfileUser, stats: { projects: projectCount, likes: 0, views: 0 } }
  }

  const [likesResult, projectViewsResult, blogViewsResult] = await Promise.all([
    projectIds.length > 0
      ? supabase.from('likes').select('id', { count: 'exact' }).in('project_id', projectIds)
      : Promise.resolve({ count: 0 }),
    projectIds.length > 0
      ? supabase.from('views').select('id', { count: 'exact' }).in('project_id', projectIds)
      : Promise.resolve({ count: 0 }),
    postIds.length > 0
      ? supabase.from('views').select('id', { count: 'exact' }).in('post_id', postIds)
      : Promise.resolve({ count: 0 }),
  ])

  const totalViews = (projectViewsResult.count || 0) + (blogViewsResult.count || 0)

  return {
    user: user as ProfileUser,
    stats: { projects: projectCount, likes: likesResult.count || 0, views: totalViews },
  }
}

async function fetchUserBlogPosts(userId: string): Promise<UserBlogPost[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('posts')
    .select(
      `id, title, slug, excerpt, cover_image, published_at, read_time_minutes, tags:blog_post_tags(post_tags(name))`,
    )
    .eq('author_id', userId)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(10)
    .returns<UserBlogPost[]>()

  if (error) return []
  return data || []
}

/**
 * Load all data needed to render a user's public profile, including the
 * authenticated viewer's identity and ownership flag. Runs server-side.
 */
export async function loadProfilePageData(username: string): Promise<ProfilePageData> {
  const supabase = await createClient()

  const [sessionResult, { user: profileUser, stats }] = await Promise.all([
    supabase.auth.getUser(),
    fetchUserProfileWithStats(username),
  ])

  const authUserResult = sessionResult.data.user

  let currentUser: ProfileAuthUser | null = null
  let isOwner = false
  if (authUserResult) {
    const { data: profile } = await supabase.from('users').select('*').eq('id', authUserResult.id).single()
    if (profile) {
      currentUser = {
        id: profile.id,
        name: profile.display_name,
        email: authUserResult.email || '',
        avatar: profile.avatar_url || '/placeholder.svg',
        avatar_url: profile.avatar_url || '/placeholder.svg',
        username: profile.username,
        role: profile.role,
      }
      isOwner = profile.username === username
    }
  }

  if (!profileUser) {
    return {
      user: null,
      currentUser,
      isLoggedIn: !!authUserResult,
      isOwner: false,
      projects: [],
      posts: [],
      stats: { projects: 0, posts: 0, likes: 0, views: 0 },
    }
  }

  const [projects, posts] = await Promise.all([fetchUserProjects(username), fetchUserBlogPosts(profileUser.id)])

  return {
    user: profileUser,
    currentUser,
    isLoggedIn: !!authUserResult,
    isOwner,
    projects,
    posts,
    stats: { ...stats, posts: posts.length },
  }
}
