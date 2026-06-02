'use client'

import { format } from 'date-fns'
import { ArrowLeft, Calendar, Clock, Eye } from 'lucide-react'
import Link from 'next/link'
import { BlogViewTracker } from '@/components/blog/blog-view-tracker'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CommentSection } from '@/components/ui/comment-section'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import { UserDisplayName } from '@/components/ui/user-display-name'
import { contentToHtml } from '@/lib/blog-utils'
import type { User } from '@/types/homepage'

export interface BlogPostAuthor {
  id: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  role: number | null
  username?: string | null
}

export interface BlogDetailPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image: string | null
  published_at: string | null
  read_time_minutes: number | null
  content: unknown
  author: BlogPostAuthor | null
  tags: string[]
}

export interface BlogDetailClientProps {
  post: BlogDetailPost
  viewCount: number
  initialComments: Awaited<ReturnType<typeof import('@/lib/actions/comments')['getComments']>>['comments']
  currentUser: User | null
  commentUser: { id: string; name: string; avatar?: string } | null
}

export default function BlogDetailClient({
  post,
  viewCount,
  initialComments,
  currentUser,
  commentUser,
}: BlogDetailClientProps) {
  const authorProfileHref = post.author?.username ? `/${post.author.username}` : '#'
  const postTags = post.tags ?? []

  return (
    <article className="min-h-screen bg-background">
      <BlogViewTracker postId={post.id} />
      <Navbar
        showBackButton={true}
        showNavigation={true}
        isLoggedIn={!!currentUser}
        user={currentUser ?? undefined}
      />

      <header className="relative min-h-[60vh] overflow-hidden pt-16">
        {post.cover_image ? (
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
              {post.author ? (
                <Link
                  href={authorProfileHref}
                  className="flex items-center gap-2 transition-colors hover:text-foreground"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={post.author.avatar_url ?? undefined} />
                    <AvatarFallback>{post.author.display_name?.charAt(0) ?? 'A'}</AvatarFallback>
                  </Avatar>
                  <UserDisplayName
                    name={post.author.display_name ?? 'Anonymous'}
                    role={post.author.role ?? null}
                    className="font-medium text-foreground"
                  />
                </Link>
              ) : null}

              {post.published_at ? (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.published_at), 'MMMM d, yyyy')}
                </span>
              ) : null}

              {post.read_time_minutes ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.read_time_minutes} min read
                </span>
              ) : null}

              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {viewCount.toLocaleString()} views
              </span>
            </div>

            {postTags.length > 0 ? (
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
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        {post.excerpt ? <p className="mb-8 text-muted-foreground text-xl italic">{post.excerpt}</p> : null}

        <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none">
          {post.content && typeof post.content === 'object' ? (
            // biome-ignore lint/security/noDangerouslySetInnerHtml: TipTap JSON is converted to escaped HTML via contentToHtml
            <div dangerouslySetInnerHTML={{ __html: contentToHtml(post.content) }} />
          ) : (
            <p>{String(post.content ?? '')}</p>
          )}
        </div>

        <hr className="my-12 border-border" />

        <CommentSection
          entityType="post"
          entityId={post.id}
          initialComments={initialComments}
          isLoggedIn={!!currentUser}
          currentUser={commentUser}
          allowGuest={false}
        />
      </div>

      <Footer />
    </article>
  )
}
