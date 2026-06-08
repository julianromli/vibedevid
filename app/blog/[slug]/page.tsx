import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ArticleContentSkeleton, ArticleHeaderSkeleton, CommentsSkeleton, Skeleton } from '@/components/ui/skeleton'
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

      <ArticleHeaderSkeleton />

      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <ArticleContentSkeleton />

        <hr className="border-border my-12" />

        <CommentsSkeleton />
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
