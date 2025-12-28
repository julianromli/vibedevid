import { Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { contentToHtml } from '@/lib/blog-utils'

interface PostContentProps {
  post: {
    title: string
    content: any
    excerpt?: string
    cover_image?: string
    published_at?: string | null
    read_time_minutes?: number
    author?: {
      display_name: string
      avatar_url?: string
    }
  }
  className?: string
}

export function PostContent({ post, className }: PostContentProps) {
  return (
    <div className={cn('mx-auto max-w-4xl px-4 md:px-8', className)}>
      <header className="mb-12">
        {post.cover_image && (
          <div className="relative mb-8 aspect-video overflow-hidden rounded-xl">
            <img
              src={post.cover_image}
              alt={post.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        )}

        <h1 className="mb-6 text-3xl font-bold tracking-tight md:text-5xl">{post.title}</h1>

        <div className="text-muted-foreground flex flex-wrap items-center gap-6 text-sm">
          {post.author && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.author.avatar_url} />
                <AvatarFallback>{post.author.display_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-foreground font-medium">{post.author.display_name}</span>
            </div>
          )}

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
        </div>
      </header>

      {post.excerpt && <p className="text-muted-foreground mb-8 text-xl italic">{post.excerpt}</p>}

      <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none">
        {post.content && typeof post.content === 'object' ? (
          <div dangerouslySetInnerHTML={{ __html: contentToHtml(post.content) }} />
        ) : (
          <p>{post.content}</p>
        )}
      </div>
    </div>
  )
}
