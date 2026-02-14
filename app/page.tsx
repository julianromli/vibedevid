import { fetchProjectsWithSorting } from '@/lib/actions'
import { createClient } from '@/lib/supabase/server'
import type { Project, User } from '@/types/homepage'
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

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ projects: initialProjects }, { data: categories }] = await Promise.all([
    fetchProjectsWithSorting('trending', undefined, 20),
    supabase.from('categories').select('display_name').eq('is_active', true).order('sort_order', { ascending: true }),
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
    />
  )
}
