import { format } from 'date-fns'
import { Calendar, Clock, Edit } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface BlogCardProps {
  post: {
    id: string
    slug: string
    title: string
    excerpt: string | null
    cover_image: string | null
    published_at: string | null
    read_time_minutes: number | null
    author: { display_name: string; avatar_url: string | null }
    tags?: string[]
  }
  /** Whether the current user is the owner of this post */
  isOwner?: boolean
}

export function BlogCard({ post, isOwner = false }: BlogCardProps) {
  return (
    <div className="group relative block overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      {/* Edit button for post owner - positioned top-right */}
      {isOwner && (
        <Link
          href={`/blog/editor/${post.slug}`}
          className="absolute top-3 right-3 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1.5 shadow-md backdrop-blur-sm"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
        </Link>
      )}

      <Link href={`/blog/${post.slug}`}>
        <div className="relative aspect-[16/9] overflow-hidden">
          {post.cover_image ? (
            <img
              src={post.cover_image}
              alt={post.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-muted-foreground">No cover</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute right-0 bottom-0 left-0 p-6">
            {post.tags && post.tags.length > 0 && (
              <div className="mb-3 flex gap-2">
                {post.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="border-white/20 bg-white/20 text-white backdrop-blur-sm"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <h3 className="mb-2 line-clamp-2 text-white text-xl md:text-2xl">{post.title}</h3>

            <div className="flex items-center gap-4 text-sm text-white/80">
              {post.read_time_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {post.read_time_minutes} min read
                </span>
              )}
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(post.published_at), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>

        {post.excerpt && (
          <div className="border-t p-4">
            <p className="line-clamp-2 text-muted-foreground text-sm">{post.excerpt}</p>
          </div>
        )}
      </Link>
    </div>
  )
}
