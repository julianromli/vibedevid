import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types/homepage'
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

  let userData: User | null = null
  if (user) {
    userData = await getUserData(user.id, user.email || '')
  }

  return (
    <HomePageClient
      initialIsLoggedIn={!!user}
      initialUser={userData}
    />
  )
}
