import { createFileRoute, redirect } from '@tanstack/react-router'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types/homepage'
import BlogEditorClient from '@/app/blog/editor/blog-editor-client'

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

export const Route = createFileRoute('/blog/editor')({
  loader: async () => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw redirect({ to: '/user/auth', search: { redirectTo: '/blog/editor' } })
    }

    const userData = await getUserData(user.id, user.email || '')

    if (!userData) {
      console.error('[BlogEditor] User profile not found for user:', user.id)
      throw redirect({ to: '/user/auth', search: { redirectTo: '/blog/editor' } })
    }

    return { user: userData }
  },
  component: BlogEditorRoute,
})

function BlogEditorRoute() {
  const { user } = Route.useLoaderData()

  return <BlogEditorClient user={user} />
}
