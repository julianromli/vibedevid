import { redirect } from 'next/navigation'
import { Navbar } from '@/components/ui/navbar'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types/homepage'

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

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/user/auth?redirectTo=/dashboard')
  }

  const userData = await getUserData(user.id, user.email || '')

  if (!userData) {
    redirect('/user/auth?redirectTo=/dashboard')
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar
        isLoggedIn={true}
        user={userData}
      />
      <main className="pt-20 pb-12 px-4 md:px-6">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  )
}
