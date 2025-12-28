import { BlogCard } from '@/components/blog/blog-card'
import { Navbar } from '@/components/ui/navbar'
import { createClient } from '@/lib/supabase/server'

interface BlogAuthor {
  display_name: string
  avatar_url: string | null
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
}

export const revalidate = 60

export default async function BlogPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userData = null
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
      author:users!posts_author_id_fkey(id, display_name, avatar_url)
    `,
    )

    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .returns<BlogPostListItem[]>()

  const posts = postsData ?? []

  return (
    <div className="bg-background min-h-screen">
      <Navbar
        isLoggedIn={!!user}
        user={userData ?? undefined}
      />

      <main className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl">Blog</h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Tutorials, case studies, and thoughts from the VibeDev community
            </p>
          </div>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard
                  key={post.id}
                  post={{
                    id: post.id,
                    slug: post.slug,
                    title: post.title,
                    excerpt: post.excerpt,
                    cover_image: post.cover_image,
                    published_at: post.published_at,
                    read_time_minutes: post.read_time_minutes,
                    author: post.author ?? {
                      display_name: 'Anonymous',
                      avatar_url: null,
                    },
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-muted-foreground text-lg">No blog posts yet. Be the first to write one!</p>
              <a
                href="/blog/editor"
                className="text-primary mt-4 inline-flex items-center gap-2 hover:underline"
              >
                Write a post
                <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
