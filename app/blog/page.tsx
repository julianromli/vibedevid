import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types/homepage'
import BlogPageClient from './blog-page-client'

interface BlogAuthor {
  display_name: string
  avatar_url: string | null
}

interface BlogPostTag {
  post_tags: { name: string } | null
}

interface BlogPostListItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image: string | null
  published_at: string | null
  read_time_minutes: number | null
  author: BlogAuthor | null
  author_id?: string
  tags?: BlogPostTag[]
}

export const revalidate = 60

export default async function BlogPage() {
  const supabase = await createClient()

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

  const { data: postsData } = await supabase
    .from('posts')
    .select(
      `
      id,
      title,
      slug,
      excerpt,
      cover_image,
      published_at,
      read_time_minutes,
      author_id,
      author:users!posts_author_id_fkey(display_name, avatar_url),
      tags:blog_post_tags(post_tags(name))
    `,
    )
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .returns<BlogPostListItem[]>()

  return (
    <BlogPageClient
      isLoggedIn={!!user}
      user={userData}
      posts={postsData || []}
    />
  )
}
