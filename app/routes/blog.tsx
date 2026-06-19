import { createFileRoute } from '@tanstack/react-router'
import { getCachedPublishedPosts } from '@/lib/server/blog-public'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types/homepage'
import BlogPageClient from '@/app/blog/blog-page-client'

export const Route = createFileRoute('/blog')({
  loader: async () => {
    const supabase = await createClient()
    const postsDataPromise = getCachedPublishedPosts()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    let userData: User | null = null
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

    const postsData = await postsDataPromise

    return {
      isLoggedIn: !!user,
      user: userData,
      posts: postsData || [],
    }
  },
  component: BlogRoute,
})

function BlogRoute() {
  const data = Route.useLoaderData()

  return (
    <BlogPageClient
      isLoggedIn={data.isLoggedIn}
      user={data.user}
      posts={data.posts}
    />
  )
}
