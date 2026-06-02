import { streamText } from 'ai'
import { type Context, Hono } from 'hono'
import { createRouteHandler } from 'uploadthing/server'
import { z } from 'zod'
import { getAIModel } from '@/lib/ai/openrouter'
import { getCategories } from '@/lib/categories'
import { checkProjectOwnership } from '@/lib/server/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { ourFileRouter } from '@/lib/uploadthing'
import { getVideoIconKey } from '@/lib/video-icon-key'
import { fetchYouTubeVideoMetadata, YouTubeMetadataError } from '@/lib/youtube-metadata'
import { isUser, requireAdmin } from '@/src/server/lib/require-admin'
import { authCallbackHandler } from '@/src/server/routes/auth-callback'
import type { Project, ProjectFilterOption, SortBy, User, VibeVideo } from '@/types/homepage'
import { fetchProjectsWithSorting, getProjectBySlug } from '../../../lib/actions'
import { getComments } from '../../../lib/actions/comments'
import { getEventBySlug, getEvents, getRelatedEvents } from '../../../lib/actions/events'
import { getCurrentUser } from '../../../lib/actions/user'

const uploadHandlers = createRouteHandler({
  router: ourFileRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
  },
})

export const apiRoutes = new Hono()

const VibeVideoWriteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  video_id: z.string().min(1).max(100).optional(),
  published_at: z.string().optional().nullable(),
  view_count: z.union([z.string(), z.number()]).optional().nullable(),
  position: z.number().int().optional(),
})

type VibeVideoRow = {
  id: string
  title: string
  description: string
  thumbnail: string
  video_id: string
  published_at: string
  view_count: string | number
  position: number
  created_at?: string
  updated_at?: string
}

const FALLBACK_VIBE_VIDEOS: VibeVideo[] = [
  {
    title: 'Next.js Tutorial: Full Stack App Development',
    description: 'Learn to build a full stack web app with Next.js, Prisma, and PostgreSQL from scratch to deployment.',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    videoId: 'dQw4w9WgXcQ',
    publishedAt: '2024-12-20',
    viewCount: '12.5K',
    iconKey: 'code',
  },
  {
    title: 'Live Coding: Building Modern Dashboard',
    description: 'Live coding session to build a modern admin dashboard with React and Tailwind CSS.',
    thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
    videoId: '9bZkp7q19f0',
    publishedAt: '2024-12-15',
    viewCount: '8.3K',
    iconKey: 'play',
  },
]

function mapVibeVideo(row: VibeVideoRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    thumbnail: row.thumbnail,
    videoId: row.video_id,
    publishedAt: row.published_at,
    viewCount: String(row.view_count ?? ''),
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapHomepageVibeVideo(row: VibeVideoRow): VibeVideo {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    thumbnail: row.thumbnail,
    videoId: row.video_id,
    publishedAt: row.published_at,
    viewCount: String(row.view_count ?? ''),
    position: row.position,
    iconKey: getVideoIconKey(row.title, row.description),
  }
}

async function requireAuthenticatedApiUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

async function requireAdminForRoute(c: Parameters<typeof requireAdmin>[0]) {
  const user = await requireAdmin(c)
  if (!isUser(user)) return user
  return null
}

apiRoutes.all('/uploadthing', (c) => uploadHandlers(c.req.raw))

apiRoutes.get('/auth-check', async (c) => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return c.json({ authenticated: !!user, user: user ? { id: user.id, email: user.email } : null })
})

apiRoutes.get('/auth/callback', authCallbackHandler)

apiRoutes.post('/ai/completion', async (c) => {
  try {
    const user = await requireAuthenticatedApiUser()
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const body = await c.req.json()
    const { prompt } = body
    if (!prompt || typeof prompt !== 'string') {
      return c.json({ error: 'Invalid prompt' }, 400)
    }
    const result = streamText({
      model: getAIModel(),
      messages: [
        {
          role: 'system',
          content: `You are an AI writing assistant that continues existing text based on context.
Give more weight to the later characters than the beginning ones.
Limit your response to no more than 200 characters.
Construct complete sentences.
Use Markdown formatting when appropriate.`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxOutputTokens: 200,
    })
    return result.toTextStreamResponse()
  } catch (_error) {
    return c.json({ error: 'Failed to generate completion' }, 500)
  }
})

apiRoutes.post('/ai/enhance-description', async (c) => {
  const { generateText } = await import('ai')
  try {
    const user = await requireAuthenticatedApiUser()
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const body = await c.req.json()
    const { description, title } = body
    if (!description || typeof description !== 'string') {
      return c.json({ error: 'Invalid description' }, 400)
    }
    const result = await generateText({
      model: getAIModel(),
      prompt: `Improve this project description for a developer showcase. Title: ${title ?? 'Unknown'}\n\nDescription:\n${description}`,
      maxOutputTokens: 500,
    })
    return c.json({ enhanced: result.text })
  } catch (_error) {
    return c.json({ error: 'Failed to enhance description' }, 500)
  }
})

apiRoutes.post('/github-import', async (c) => {
  const { repoUrl } = await c.req.json<{ repoUrl?: string }>()
  if (!repoUrl) return c.json({ error: 'repoUrl required' }, 400)
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!match) return c.json({ error: 'Invalid GitHub URL' }, 400)
  const [, owner, repo] = match
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo.replace(/\.git$/, '')}`, { headers })
  if (!res.ok) return c.json({ error: 'Failed to fetch repository' }, res.status as 400)
  const data = await res.json()
  return c.json({
    name: data.name,
    description: data.description,
    stars: data.stargazers_count,
    language: data.language,
    url: data.html_url,
  })
})

apiRoutes.post('/youtube', async (c) => {
  try {
    const { url } = await c.req.json<{ url?: string }>()
    return c.json(await fetchYouTubeVideoMetadata(url ?? ''))
  } catch (error) {
    if (error instanceof YouTubeMetadataError) {
      return c.json({ error: error.message }, error.status as 400)
    }

    return c.json({ error: 'Terjadi error saat mengambil data video. Coba lagi ya cuy!' }, 500)
  }
})

apiRoutes.get('/vibe-videos', async (c) => {
  const unauthorized = await requireAdminForRoute(c)
  if (unauthorized) return unauthorized

  const supabase = createAdminClient()
  const { data, error } = await supabase.from('vibe_videos').select('*').order('position', { ascending: true })
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ videos: (data ?? []).map((row) => mapVibeVideo(row as VibeVideoRow)) })
})

async function updateVibeVideo(c: Context) {
  const unauthorized = await requireAdminForRoute(c)
  if (unauthorized) return unauthorized

  const supabase = createAdminClient()
  const parsed = VibeVideoWriteSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: 'Invalid video payload', issues: parsed.error.flatten().fieldErrors }, 400)
  }
  const { data, error } = await supabase
    .from('vibe_videos')
    .update(parsed.data)
    .eq('id', c.req.param('id'))
    .select()
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ video: mapVibeVideo(data as VibeVideoRow) })
}

apiRoutes.patch('/vibe-videos/:id', updateVibeVideo)
apiRoutes.put('/vibe-videos/:id', updateVibeVideo)

apiRoutes.delete('/vibe-videos/:id', async (c) => {
  const unauthorized = await requireAdminForRoute(c)
  if (unauthorized) return unauthorized

  const supabase = createAdminClient()
  const { error } = await supabase.from('vibe_videos').delete().eq('id', c.req.param('id'))
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

apiRoutes.post('/vibe-videos', async (c) => {
  const unauthorized = await requireAdminForRoute(c)
  if (unauthorized) return unauthorized

  const supabase = createAdminClient()
  const parsed = VibeVideoWriteSchema.required({
    title: true,
    description: true,
    thumbnail: true,
    video_id: true,
    published_at: true,
    view_count: true,
  }).safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: 'Invalid video payload', issues: parsed.error.flatten().fieldErrors }, 400)
  }
  const { data, error } = await supabase.from('vibe_videos').insert(parsed.data).select().single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ video: mapVibeVideo(data as VibeVideoRow) })
})

// Page data endpoints
apiRoutes.get('/pages/home', async (c) => {
  const filter = c.req.query('filter')
  const sort = (c.req.query('sort') as SortBy) || 'trending'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: categories } = await supabase
    .from('categories')
    .select('name, display_name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const categoryOptions: ProjectFilterOption[] = (categories ?? []).map((category) => ({
    value: category.name,
    label: category.display_name,
  }))

  const initialFilter = categoryOptions.some((cat) => cat.value === filter) ? (filter ?? 'all') : 'all'
  const { projects: initialProjects } = await fetchProjectsWithSorting(
    sort,
    initialFilter === 'all' ? undefined : initialFilter,
    20,
  )

  let initialUser: User | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('id, display_name, avatar_url, username, role')
      .eq('id', user.id)
      .single()
    if (profile) {
      initialUser = {
        id: profile.id,
        name: profile.display_name,
        email: user.email || '',
        avatar: profile.avatar_url || '/vibedev-guest-avatar.png',
        username: profile.username,
        role: profile.role ?? null,
      }
    }
  }

  const admin = createAdminClient()
  const { data: vibeRows, error: vibeRowsError } = await admin
    .from('vibe_videos')
    .select('*')
    .order('position', { ascending: true })
  const initialVibeVideos: VibeVideo[] =
    vibeRowsError || !vibeRows?.length ? FALLBACK_VIBE_VIDEOS : (vibeRows as VibeVideoRow[]).map(mapHomepageVibeVideo)

  return c.json({
    initialIsLoggedIn: !!user,
    initialUser,
    initialProjects: (initialProjects ?? []) as Project[],
    initialCategories: categoryOptions,
    initialFilter,
    initialSort: sort,
    initialVibeVideos,
  })
})

apiRoutes.get('/pages/project/:slug', async (c) => {
  const slug = c.req.param('slug')
  const [{ user: currentUser }, { project, error: projectError }, categories] = await Promise.all([
    getCurrentUser(),
    getProjectBySlug(slug),
    getCategories(),
  ])

  if (projectError || !project) {
    return c.json({ project: null, comments: [], categories, currentUser, isOwner: false, error: projectError })
  }

  const { comments } = await getComments('project', project.id)
  const isOwner =
    currentUser?.id && project.author.username
      ? await checkProjectOwnership(project.author.username, currentUser.id)
      : false

  return c.json({ project, comments, categories, currentUser, isOwner })
})

apiRoutes.get('/pages/event/:slug', async (c) => {
  const slug = c.req.param('slug')
  const [{ event, error: eventError }, { user: currentUser }] = await Promise.all([
    getEventBySlug(slug),
    getCurrentUser(),
  ])

  if (eventError || !event) {
    return c.json({ event: null, relatedEvents: [], currentUser: currentUser ?? null, error: eventError })
  }

  const { events: relatedEvents } = await getRelatedEvents(event.category, event.id)
  return c.json({ event, relatedEvents, currentUser: currentUser ?? null })
})

apiRoutes.get('/pages/blog/:slug', async (c) => {
  const slug = c.req.param('slug')
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  const { data: post, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      author:users!posts_author_id_fkey(id, display_name, avatar_url, bio, role, username),
      tags:blog_post_tags(post_tags(name))
    `,
    )
    .eq('slug', slug)
    .single()

  if (error || !post || post.status !== 'published') {
    return c.json({
      post: null,
      comments: [],
      viewCount: 0,
      currentUser: null,
      commentUser: null,
    })
  }

  const rawTags = post.tags as unknown as Array<{ post_tags: { name: string } | null }> | null
  const tags = rawTags?.map((t) => t.post_tags?.name).filter((name): name is string => Boolean(name)) ?? []

  const [{ count: viewCount }, { comments }] = await Promise.all([
    supabase.from('views').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
    getComments('post', post.id),
  ])

  let currentUser = null
  let commentUser: { id: string; name: string; avatar?: string } | null = null

  if (authUser) {
    const { data: profile } = await supabase
      .from('users')
      .select('id, display_name, avatar_url, username, role')
      .eq('id', authUser.id)
      .single()

    if (profile) {
      currentUser = {
        id: profile.id,
        username: profile.username,
        name: profile.display_name,
        displayName: profile.display_name,
        email: authUser.email || '',
        avatar: profile.avatar_url || '/vibedev-guest-avatar.png',
        avatar_url: profile.avatar_url,
        role: profile.role ?? null,
      }
      commentUser = {
        id: profile.id,
        name: profile.display_name || profile.username,
        avatar: profile.avatar_url || undefined,
      }
    }
  }

  const { tags: _nestedTags, author, ...postFields } = post

  return c.json({
    post: {
      ...postFields,
      author: author as Record<string, unknown> | null,
      tags,
    },
    comments,
    viewCount: viewCount ?? 0,
    currentUser,
    commentUser,
  })
})

apiRoutes.get('/pages/events', async (c) => {
  return c.json(await getEvents())
})

apiRoutes.get('/session', async (c) => {
  return c.json(await getCurrentUser())
})

apiRoutes.get('/pages/project-submit', async (c) => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    return c.json({ unauthorized: true }, 401)
  }
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  return c.json({ userId: data.user.id, categories: categories ?? [] })
})

apiRoutes.get('/pages/project-list', async (c) => {
  const filter = c.req.query('filter')
  const sort = (c.req.query('sort') as SortBy) || 'trending'
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('name, display_name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  const filterOptions = (categories ?? []).map((category) => ({
    value: category.name,
    label: category.display_name,
  }))
  const initialFilter = filterOptions.some((cat) => cat.value === filter) ? (filter ?? 'all') : 'all'
  const { projects: initialProjects } = await fetchProjectsWithSorting(
    sort,
    initialFilter === 'all' ? undefined : initialFilter,
    50,
  )
  return c.json({ initialProjects: initialProjects ?? [], initialFilter, initialSort: sort, filterOptions })
})

apiRoutes.get('/pages/blog', async (c) => {
  const { getCachedPublishedPosts } = await import('@/lib/server/blog-public')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  let userData = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('id, display_name, avatar_url, username, role')
      .eq('id', user.id)
      .single()
    if (profile) {
      userData = {
        id: profile.id,
        name: profile.display_name,
        email: user.email || '',
        avatar: profile.avatar_url || '/vibedev-guest-avatar.png',
        username: profile.username,
        role: profile.role ?? null,
      }
    }
  }
  const posts = await getCachedPublishedPosts()
  return c.json({ isLoggedIn: !!user, user: userData, posts: posts ?? [] })
})
