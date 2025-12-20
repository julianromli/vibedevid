import Link from 'next/link'
import { format } from 'date-fns'
import { Clock, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface BlogCardProps {
  post: {
    id: string
    title: string
    excerpt: string | null
    cover_image: string | null
    published_at: string | null
    read_time_minutes: number | null
    author: { display_name: string; avatar_url: string | null }
    tags?: string[]
  }
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.id}`}
      className="group bg-card hover:shadow-primary/5 relative block overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg"
    >
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
          <div className="bg-muted flex h-full w-full items-center justify-center">
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

          <h3 className="mb-2 line-clamp-2 font-serif text-xl text-white md:text-2xl">
            {post.title}
          </h3>

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
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {post.excerpt}
          </p>
        </div>
      )}
    </Link>
  )
}
