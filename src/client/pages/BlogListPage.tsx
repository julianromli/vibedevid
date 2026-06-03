'use client'

import { useQuery } from '@tanstack/react-query'
import { PageLoadingShell } from '@/src/client/components/PageLoadingShell'
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
    return <PageLoadingShell />
  }

  return (
    <BlogPageClient
      isLoggedIn={data.isLoggedIn}
      user={data.user}
      posts={data.posts}
    />
  )
}
