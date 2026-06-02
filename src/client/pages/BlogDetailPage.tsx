'use client'

import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import BlogDetailClient from '@/components/blog/blog-detail-client'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['blog', slug],
    queryFn: async () => {
      const res = await fetch(`/api/pages/blog/${slug}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load')
      return res.json()
    },
    enabled: !!slug,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const post = data?.post
  if (isError || !post) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p>Post not found.</p>
          <Link
            to="/blog"
            className="text-primary underline"
          >
            Back to blog
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <BlogDetailClient
      post={post}
      viewCount={data.viewCount ?? 0}
      initialComments={data.comments ?? []}
      currentUser={data.currentUser ?? null}
      commentUser={data.commentUser ?? null}
    />
  )
}
