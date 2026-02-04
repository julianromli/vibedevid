import { format } from 'date-fns'
import { ArrowLeft, Calendar, Clock, Eye } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BlogViewTracker } from '@/components/blog/blog-view-tracker'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CommentSection } from '@/components/ui/comment-section'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import { UserDisplayName } from '@/components/ui/user-display-name'
import { getComments } from '@/lib/actions/comments'
import { contentToHtml } from '@/lib/blog-utils'
import { absoluteUrl } from '@/lib/seo/site-url'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ slug: string }>
}

const DEFAULT_OG_IMAGE = 'https://elyql1q8be.ufs.sh/f/SidHyTM6vHFNWvWOsz96heqapobuABSCvEXgf9wT2xdRkGM0'

export const revalidate = 300

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select(`
      title,
      excerpt,
      cover_image,
      published_at,
      author:users!posts_author_id_fkey(display_name),
      tags:blog_post_tags(post_tags(name))
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The blog post you are looking for does not exist.',
    }
  }

  const postUrl = absoluteUrl(`/blog/${slug}`)
  const ogImage = post.cover_image || DEFAULT_OG_IMAGE
  // Supabase returns author as object when using foreign key join with .single()
  const author = post.author as unknown as { display_name: string } | null
  const authorName = author?.display_name || 'VibeDev ID'
  // Extract tags from nested structure with proper type guard
  const tags = post.tags as unknown as Array<{ post_tags: { name: string } | null }> | null
  const postTags = tags?.map((t) => t.post_tags?.name).filter((name): name is string => Boolean(name)) ?? []

  return {
    title: post.title,
    description: post.excerpt || `Baca artikel ${post.title} di VibeDev ID Blog`,
    keywords: postTags.length > 0 ? postTags : undefined,
    authors: [{ name: authorName }],
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt || `Baca artikel ${post.title} di VibeDev ID Blog`,
      url: postUrl,
      siteName: 'VibeDev ID',
      locale: 'id_ID',
      type: 'article',
      publishedTime: post.published_at || undefined,
      authors: [authorName],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || `Baca artikel ${post.title} di VibeDev ID Blog`,
      images: [ogImage],
      site: '@vibedevid',
      creator: '@vibedevid',
    },
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: legacy page with lots of UI + data fetching
export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (process.env.NODE_ENV !== 'production') {
    console.log('[BlogPostPage auth]', {
      slug,
      hasUser: Boolean(user),
      userId: user?.id ?? null,
    })
  }

  let userData = null
  let commentUser: { id: string; name: string; avatar?: string } | null = null
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
      commentUser = {
        id: profile.id,
        name: profile.display_name,
        avatar: profile.avatar_url || undefined,
      }
    }
  }

  const { data: post, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      author:users!posts_author_id_fkey(id, display_name, avatar_url, bio, role),
      tags:blog_post_tags(post_tags(name))
    `,
    )
    .eq('slug', slug)
    .single()

  // Fetch view count for this post
  const [{ count: viewCount }, { comments: initialComments }] = await Promise.all([
    supabase.from('views').select('*', { count: 'exact', head: true }).eq('post_id', post?.id),
    getComments('post', post?.id ?? ''),
  ])

  // Flatten tags from nested structure
  const postTags: string[] =
    post?.tags?.map((t: { post_tags: { name: string } | null }) => t.post_tags?.name).filter(Boolean) ?? []

  if (error || !post || post.status !== 'published') {
    notFound()
  }

  return (
    <article className="min-h-screen bg-background">
      <BlogViewTracker postId={post.id} />
      <Navbar
        showBackButton={true}
        showNavigation={true}
        isLoggedIn={!!user}
        user={userData ?? undefined}
      />

      <header className="relative min-h-[60vh] overflow-hidden pt-16">
        {post.cover_image ? (
          /* biome-ignore lint/performance/noImgElement: cover image may be remote and handled by existing setup */
          <img
            src={post.cover_image}
            alt={post.title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        <div className="absolute top-20 left-4 md:left-8 lg:left-16">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to blog
          </Link>
        </div>

        <div className="absolute right-0 bottom-0 left-0 pb-12 md:pb-20">
          <div className="mx-auto max-w-4xl px-4 md:px-8">
            <h1 className="mb-6 font-bold text-3xl tracking-tight md:text-5xl">{post.title}</h1>

            <div className="flex flex-wrap items-center gap-6 text-muted-foreground text-sm">
              <Link
                href={`/${post.author?.display_name?.toLowerCase().replace(/\s+/g, '')}`}
                className="flex items-center gap-2 transition-colors hover:text-foreground"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={post.author?.avatar_url ?? undefined} />
                  <AvatarFallback>{post.author?.display_name?.charAt(0) ?? 'A'}</AvatarFallback>
                </Avatar>
                <UserDisplayName
                  name={post.author?.display_name ?? 'Anonymous'}
                  role={post.author?.role ?? null}
                  className="font-medium text-foreground"
                />
              </Link>

              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.published_at), 'MMMM d, yyyy')}
                </span>
              )}

              {post.read_time_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.read_time_minutes} min read
                </span>
              )}

              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {(viewCount || 0).toLocaleString()} views
              </span>
            </div>

            {/* Tags Section */}
            {postTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {postTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-foreground/20 bg-background/50 px-3 py-1 text-sm backdrop-blur-sm transition-colors hover:border-foreground/40 hover:bg-background/80"
                  >
                    <span className="text-muted-foreground">#</span>
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        {post.excerpt && <p className="mb-8 text-muted-foreground text-xl italic">{post.excerpt}</p>}

        <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none">
          {post.content && typeof post.content === 'object' ? (
            /* biome-ignore lint/security/noDangerouslySetInnerHtml: post content is sanitized/serialized before render */
            <div dangerouslySetInnerHTML={{ __html: contentToHtml(post.content) }} />
          ) : (
            <p>{post.content}</p>
          )}
        </div>

        <hr className="my-12 border-border" />

        <CommentSection
          entityType="post"
          entityId={post.id}
          initialComments={initialComments}
          isLoggedIn={!!user}
          currentUser={commentUser}
          allowGuest={false}
        />
      </div>

      <Footer />
    </article>
  )
}
