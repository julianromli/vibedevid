import { streamText } from 'ai'
import { Hono } from 'hono'
import { createRouteHandler } from 'uploadthing/server'
import { getAIModel } from '@/lib/ai/openrouter'
import { fetchProjectsWithSorting, getProjectBySlug } from '../../../lib/actions'
import { getComments } from '../../../lib/actions/comments'
import { getEventBySlug, getRelatedEvents, getEvents } from '../../../lib/actions/events'
import { getPostForEdit, getTags } from '../../../lib/actions/blog'
import { getCategories } from '@/lib/categories'
import { checkProjectOwnership } from '@/lib/server/auth'
import { getCurrentUser } from '../../../lib/actions/user'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { ourFileRouter } from '@/lib/uploadthing'
import { getVideoIconKey } from '@/lib/video-icon-key'
import type { Project, ProjectFilterOption, SortBy, User, VibeVideo } from '@/types/homepage'
import { authCallbackHandler } from '@/src/server/routes/auth-callback'

const uploadHandlers = createRouteHandler({
  router: ourFileRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
  },
})

export const apiRoutes = new Hono()

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
  } catch (error) {
    console.error('AI completion error:', error)
    return c.json({ error: 'Failed to generate completion' }, 500)
  }
})

apiRoutes.post('/ai/enhance-description', async (c) => {
  const { generateText } = await import('ai')
  try {
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
  } catch (error) {
    console.error('AI enhance error:', error)
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
  const { url } = await c.req.json<{ url?: string }>()
  if (!url) return c.json({ error: 'url required' }, 400)
  const oembed = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
  if (!oembed.ok) return c.json({ error: 'Invalid YouTube URL' }, 400)
  return c.json(await oembed.json())
})

apiRoutes.get('/vibe-videos', async (c) => {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('vibe_videos').select('*').order('position', { ascending: true })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

apiRoutes.patch('/vibe-videos/:id', async (c) => {
  const supabase = createAdminClient()
  const body = await c.req.json()
  const { data, error } = await supabase.from('vibe_videos').update(body).eq('id', c.req.param('id')).select().single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

apiRoutes.delete('/vibe-videos/:id', async (c) => {
  const supabase = createAdminClient()
  const { error } = await supabase.from('vibe_videos').delete().eq('id', c.req.param('id'))
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

apiRoutes.post('/vibe-videos', async (c) => {
  const supabase = createAdminClient()
  const body = await c.req.json()
  const { data, error } = await supabase.from('vibe_videos').insert(body).select().single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
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
  const { data: vibeRows } = await admin.from('vibe_videos').select('*').order('position', { ascending: true })
  const initialVibeVideos: VibeVideo[] = (vibeRows ?? []).map((video) => ({
    id: video.id,
    title: video.title,
    description: video.description,
    thumbnail: video.thumbnail,
    videoId: video.video_id,
    publishedAt: video.published_at,
    viewCount: video.view_count,
    position: video.position,
    iconKey: getVideoIconKey(video.title, video.description),
  }))

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
  const isOwner = currentUser ? await checkProjectOwnership(project.author.username, currentUser.id) : false

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
