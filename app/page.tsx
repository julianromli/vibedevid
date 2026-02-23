import { fetchProjectsWithSorting } from '@/lib/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getVideoIconKey } from '@/lib/video-icon-key'
import type { Project, User, VibeVideo } from '@/types/homepage'
import HomePageClient from './home-page-client'

async function getUserData(userId: string, email: string): Promise<User | null> {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name, avatar_url, username, role')
    .eq('id', userId)
    .single()

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
    const { data, error } = await supabase.from('vibe_videos').select('*').order('position', { ascending: true })

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

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ projects: initialProjects }, { data: categories }, initialVibeVideos] = await Promise.all([
    fetchProjectsWithSorting('trending', undefined, 20),
    supabase.from('categories').select('display_name').eq('is_active', true).order('sort_order', { ascending: true }),
    getVibeVideos(),
  ])

  const initialFilterOptions = ['All', ...((categories ?? []).map((category) => category.display_name) as string[])]

  let userData: User | null = null
  if (user) {
    userData = await getUserData(user.id, user.email || '')
  }

  return (
    <HomePageClient
      initialIsLoggedIn={!!user}
      initialUser={userData}
      initialProjects={(initialProjects ?? []) as Project[]}
      initialFilterOptions={initialFilterOptions}
      initialVibeVideos={initialVibeVideos}
    />
  )
}
