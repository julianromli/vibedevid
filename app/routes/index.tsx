import { createFileRoute } from '@tanstack/react-router'
import { fetchProjectsWithSorting } from '@/lib/actions'
import { getCategories } from '@/lib/categories'
import { getSingleSearchParam, normalizeSortParam } from '@/lib/routes/helpers'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getVideoIconKey } from '@/lib/video-icon-key'
import type { Project, ProjectFilterOption, User, VibeVideo } from '@/types/homepage'
import HomePageClient from '@/app/home-page-client'

interface VibeVideoRow {
  id: string
  title: string
  description: string
  thumbnail: string
  video_id: string
  published_at: string
  view_count: string
  position: number
}

async function getUserData(userId: string, email: string): Promise<User | null> {
  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from('users')
    .select('id, display_name, avatar_url, username, role')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[getUserData] Supabase error fetching profile:', error)
    }
    return null
  }

  if (!profile) {
    return null
  }

  return {
    id: profile.id,
    name: profile.display_name,
    email,
    avatar: profile.avatar_url || '/vibedev-guest-avatar.png',
    username: profile.username,
    role: profile.role ?? null,
  }
}

async function getVibeVideos(): Promise<VibeVideo[]> {
  const fallbackVideos: VibeVideo[] = [
    {
      title: 'Next.js Tutorial: Full Stack App Development',
      description:
        'Learn to build a full stack web app with Next.js, Prisma, and PostgreSQL from scratch to deployment.',
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

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('vibe_videos')
      .select('id, title, description, thumbnail, video_id, published_at, view_count, position')
      .order('position', { ascending: true })

    if (error || !data || data.length === 0) {
      return fallbackVideos
    }

    return (data as VibeVideoRow[]).map((video) => ({
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
  } catch {
    return fallbackVideos
  }
}

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => ({
    filter: typeof search.filter === 'string' ? search.filter : undefined,
    sort: typeof search.sort === 'string' ? search.sort : undefined,
  }),
  loaderDeps: ({ search }) => ({ filter: search.filter, sort: search.sort }),
  loader: async ({ deps }) => {
    const search = deps
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const [categories, initialVibeVideos] = await Promise.all([getCategories(), getVibeVideos()])

    const categoryOptions: ProjectFilterOption[] = (categories ?? []).map((category) => ({
      value: category.name,
      label: category.display_name,
    }))

    const requestedFilter = getSingleSearchParam(search.filter)
    const initialFilter = categoryOptions.some((category) => category.value === requestedFilter)
      ? (requestedFilter ?? 'all')
      : 'all'
    const initialSort = normalizeSortParam(getSingleSearchParam(search.sort))

    const [{ projects: initialProjects }] = await Promise.all([
      fetchProjectsWithSorting(initialSort, initialFilter === 'all' ? undefined : initialFilter, 20),
    ])

    let userData: User | null = null
    if (user) {
      userData = await getUserData(user.id, user.email || '')
    }

    return {
      initialIsLoggedIn: !!user,
      initialUser: userData,
      initialProjects: (initialProjects ?? []) as Project[],
      initialCategories: categoryOptions,
      initialFilter,
      initialSort,
      initialVibeVideos,
    }
  },
  component: HomeRoute,
})

function HomeRoute() {
  const data = Route.useLoaderData()

  return (
    <HomePageClient
      initialIsLoggedIn={data.initialIsLoggedIn}
      initialUser={data.initialUser}
      initialProjects={data.initialProjects}
      initialCategories={data.initialCategories}
      initialFilter={data.initialFilter}
      initialSort={data.initialSort}
      initialVibeVideos={data.initialVibeVideos}
    />
  )
}
