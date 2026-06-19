import { createFileRoute, redirect } from '@tanstack/react-router'
import { getPostForEdit } from '@/lib/actions/blog'
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

export const Route = createFileRoute('/blog/editor/$slug')({
  loader: async ({ params }) => {
    const { slug } = params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw redirect({ to: '/user/auth', search: { redirectTo: `/blog/editor/${slug}` } })
    }

    const [userData, postResult] = await Promise.all([getUserData(user.id, user.email || ''), getPostForEdit(slug)])

    if (!userData) {
      throw redirect({ to: '/user/auth', search: { redirectTo: `/blog/editor/${slug}` } })
    }

    if (!postResult.success || !postResult.data) {
      throw redirect({ to: '/dashboard/posts' })
    }

    return {
      user: userData,
      initialData: postResult.data,
    }
  },
  component: BlogEditorEditRoute,
})

function BlogEditorEditRoute() {
  const { user, initialData } = Route.useLoaderData()

  return (
    <BlogEditorClient
      user={user}
      initialData={initialData}
      mode="edit"
    />
  )
}
