'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface BlogPostTag {
  post_tags: { name: string } | null
}

interface UserBlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image: string | null
  published_at: string | null
  read_time_minutes: number | null
  tags?: BlogPostTag[]
}

interface BlogTabProps {
  posts: UserBlogPost[]
}

export function BlogTab({ posts }: BlogTabProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => {
        const tags = post.tags?.map((t) => t.post_tags?.name).filter(Boolean) || []

        return (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-muted">
              {post.cover_image ? (
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="text-muted-foreground">No Cover</span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

              <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
                {tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="border-white/10 bg-black/40 px-2 py-0.5 text-xs text-white backdrop-blur-md hover:bg-black/60"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <h3 className="mb-2 text-lg font-bold leading-tight transition-colors group-hover:text-primary line-clamp-2">
                {post.title}
              </h3>

              <p className="mb-4 text-sm text-muted-foreground line-clamp-2 flex-1">
                {post.excerpt || 'No excerpt available.'}
              </p>

              <div className="flex items-center justify-between border-t pt-4 mt-auto">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {post.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(post.published_at), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
                {post.read_time_minutes && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {post.read_time_minutes} min
                  </span>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
