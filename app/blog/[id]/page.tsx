import { format } from 'date-fns'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CommentSection } from '@/components/blog/comment-section'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Navbar } from '@/components/ui/navbar'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ id: string }>
}

export const revalidate = 300

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt, cover_image')
    .eq('id', id)
    .single()

  if (!post) {
    return { title: 'Post Not Found' }
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      images: post.cover_image ? [post.cover_image] : [],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { id } = await params
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

  const { data: post, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      author:users!posts_author_id_fkey(id, display_name, avatar_url, bio)
    `,
    )
    .eq('id', id)
    .single()

  if (error || !post || post.status !== 'published') {
    notFound()
  }

  return (
    <article className="bg-background min-h-screen">
      <Navbar isLoggedIn={!!user} user={userData ?? undefined} />

      <header className="relative h-[50vh] overflow-hidden">
        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt={post.title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="from-primary/20 to-primary/5 h-full w-full bg-gradient-to-br" />
        )}
        <div className="from-background via-background/60 absolute inset-0 bg-gradient-to-t to-transparent" />

        <div className="absolute top-20 left-4 md:left-8 lg:left-16">
          <Link
            href="/blog"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to blog
          </Link>
        </div>

        <div className="absolute right-0 bottom-0 left-0 pb-12 md:pb-20">
          <div className="mx-auto max-w-4xl px-4 md:px-8">
            <h1 className="mb-6 text-3xl font-bold tracking-tight md:text-5xl">
              {post.title}
            </h1>

            <div className="text-muted-foreground flex flex-wrap items-center gap-6 text-sm">
              <Link
                href={`/${post.author?.[0]?.display_name?.toLowerCase().replace(/\s+/g, '')}`}
                className="hover:text-foreground flex items-center gap-2 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={post.author?.[0]?.avatar_url ?? undefined}
                  />
                  <AvatarFallback>
                    {post.author?.[0]?.display_name?.charAt(0) ?? 'A'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-foreground font-medium">
                  {post.author?.[0]?.display_name ?? 'Anonymous'}
                </span>
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
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        {post.excerpt && (
          <p className="text-muted-foreground mb-8 text-xl italic">
            {post.excerpt}
          </p>
        )}

        <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none">
          {post.content && typeof post.content === 'object' ? (
            <div
              dangerouslySetInnerHTML={{ __html: contentToHtml(post.content) }}
            />
          ) : (
            <p>{post.content}</p>
          )}
        </div>

        <hr className="border-border my-12" />

        <CommentSection postId={post.id} />
      </div>
    </article>
  )
}

function contentToHtml(content: Record<string, any>): string {
  return contentToHtmlRecursive(content)
}

function contentToHtmlRecursive(node: any): string {
  if (typeof node === 'string') return node

  if (!node || !node.type) return ''

  switch (node.type) {
    case 'doc':
      return node.content?.map(contentToHtmlRecursive).join('') ?? ''
    case 'paragraph':
      return `<p>${node.content?.map(contentToHtmlRecursive).join('') ?? ''}</p>`
    case 'heading': {
      const level = node.attrs?.level ?? 2
      return `<h${level}>${node.content?.map(contentToHtmlRecursive).join('') ?? ''}</h${level}>`
    }
    case 'bulletList':
      return `<ul>${node.content?.map(contentToHtmlRecursive).join('') ?? ''}</ul>`
    case 'orderedList':
      return `<ol>${node.content?.map(contentToHtmlRecursive).join('') ?? ''}</ol>`
    case 'listItem':
      return `<li>${node.content?.map(contentToHtmlRecursive).join('') ?? ''}</li>`
    case 'codeBlock':
      return `<pre><code>${node.content?.map(contentToHtmlRecursive).join('') ?? ''}</code></pre>`
    case 'image':
      return `<img src="${node.attrs?.src ?? ''}" alt="${node.attrs?.alt ?? ''}" />`
    case 'text': {
      let html = node.text ?? ''
      if (node.marks) {
        node.marks.forEach((mark: any) => {
          switch (mark.type) {
            case 'bold':
              html = `<strong>${html}</strong>`
              break
            case 'italic':
              html = `<em>${html}</em>`
              break
            case 'code':
              html = `<code>${html}</code>`
              break
            case 'link':
              html = `<a href="${mark.attrs?.href ?? ''}">${html}</a>`
              break
          }
        })
      }
      return html
    }
    default:
      return node.content?.map(contentToHtmlRecursive).join('') ?? ''
  }
}
