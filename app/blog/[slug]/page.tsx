import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { absoluteUrl } from '@/lib/seo/site-url'
import { createClient } from '@/lib/supabase/server'
import BlogPostData from './blog-post-data'

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
  const author = post.author as unknown as { display_name: string } | null
  const authorName = author?.display_name || 'VibeDev ID'
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

function BlogPostLoadingFallback() {
  return (
    <article className="min-h-screen bg-background">
      <nav className="h-16 w-full border-b bg-background/80 backdrop-blur-md" />

      <header className="relative min-h-[60vh] overflow-hidden pt-16">
        <Skeleton className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        <div className="absolute top-20 left-4 md:left-8 lg:left-16">
          <Skeleton className="h-5 w-32" />
        </div>

        <div className="absolute right-0 bottom-0 left-0 pb-12 md:pb-20">
          <div className="mx-auto max-w-4xl px-4 md:px-8">
            <Skeleton className="mb-6 h-10 w-3/4 md:h-12" />

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-16 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <Skeleton className="mb-8 h-7 w-full max-w-3xl" />

        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        <hr className="border-border my-12" />

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <div className="flex justify-end">
              <Skeleton className="h-9 w-28" />
            </div>
          </div>

          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-lg border p-4"
              >
                <div className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t bg-background py-12">
        <div className="mx-auto max-w-7xl px-4">
          <Skeleton className="mx-auto h-5 w-64" />
          <Skeleton className="mx-auto mt-2 h-4 w-48" />
        </div>
      </footer>
    </article>
  )
}

export default function BlogPostPage({ params }: Props) {
  return (
    <Suspense fallback={<BlogPostLoadingFallback />}>
      <BlogPostData params={params} />
    </Suspense>
  )
}
