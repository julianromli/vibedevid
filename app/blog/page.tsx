import { getCachedPublishedPosts } from '@/lib/server/blog-public'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types/homepage'
import BlogPageClient from './blog-page-client'

export const revalidate = 60

export default async function BlogPage() {
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

  return (
    <BlogPageClient
      isLoggedIn={!!user}
      user={userData}
      posts={postsData || []}
    />
  )
}
