'use client'

import { FileText, PenSquare } from 'lucide-react'
import Link from 'next/link'
import { BlogCard } from '@/components/blog/blog-card'
import { FloatingWriteButton } from '@/components/blog/floating-write-button'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import type { User } from '@/types/homepage'

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

interface BlogPageClientProps {
  isLoggedIn: boolean
  user: User | null
  posts: BlogPostListItem[]
}

export default function BlogPageClient({ isLoggedIn, user, posts }: BlogPageClientProps) {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  // Flatten tags from nested structure to string array
  const flattenedPosts = posts.map((post) => ({
    ...post,
    tags: (post.tags?.map((t) => t.post_tags?.name).filter(Boolean) as string[]) || [],
  }))

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        showNavigation={true}
        isLoggedIn={isLoggedIn}
        user={user ?? undefined}
        scrollToSection={scrollToSection}
      />

      <main className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-16">
            <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
              <div>
                <h1 className="mb-4 font-bold text-4xl tracking-tight md:text-6xl">Blog</h1>
                <p className="max-w-2xl text-lg text-muted-foreground">
                  Tutorials, case studies, and thoughts from the VibeDev community
                </p>
              </div>

              {/* Quick Actions for logged-in users */}
              {isLoggedIn && (
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/dashboard/posts">
                    <Button
                      variant="outline"
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      My Posts
                    </Button>
                  </Link>
                  <Link href="/blog/editor">
                    <Button className="gap-2">
                      <PenSquare className="h-4 w-4" />
                      Write a Post
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {flattenedPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {flattenedPosts.map((post) => (
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
                    tags: post.tags,
                  }}
                  isOwner={user?.id === post.author_id}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mb-2 font-medium text-lg">No blog posts yet</p>
              <p className="mb-6 text-muted-foreground">Be the first to share your knowledge with the community!</p>
              {isLoggedIn ? (
                <Link href="/blog/editor">
                  <Button className="gap-2">
                    <PenSquare className="h-4 w-4" />
                    Write your first post
                  </Button>
                </Link>
              ) : (
                <Link href="/user/auth?redirectTo=/blog/editor">
                  <Button className="gap-2">Sign in to write</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Floating Write Button for mobile/scroll access */}
      <FloatingWriteButton isLoggedIn={isLoggedIn} />

      <Footer />
    </div>
  )
}
