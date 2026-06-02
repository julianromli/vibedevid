'use client'

import { useQuery } from '@tanstack/react-query'
import BlogPageClient from '@/src/client/features/blog/BlogPageClient'

export default function BlogListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['blog-list'],
    queryFn: async () => {
      const res = await fetch('/api/pages/blog')
      if (!res.ok) throw new Error('Failed to load blog')
      return res.json()
    },
  })

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <BlogPageClient
      isLoggedIn={data.isLoggedIn}
      user={data.user}
      posts={data.posts}
    />
  )
}
