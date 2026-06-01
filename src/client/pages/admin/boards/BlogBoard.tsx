'use client'

import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { PostFilters } from '@/app/(admin)/dashboard/boards/blog/components/post-filters'
import { PostsTable } from '@/app/(admin)/dashboard/boards/blog/components/posts-table'
import { TagsManager } from '@/app/(admin)/dashboard/boards/blog/components/tags-manager'
import { Skeleton } from '@/components/ui/skeleton'

export function BlogBoard() {
  const [searchParams] = useSearchParams()
  const status = searchParams.get('status') ?? undefined
  const search = searchParams.get('search') ?? undefined
  const page = searchParams.get('page') ? Number.parseInt(searchParams.get('page')!, 10) : 1

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'posts', status, search, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      if (search) params.set('search', search)
      if (page > 1) params.set('page', String(page))
      const res = await fetch(`/api/admin/posts?${params}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load posts')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || data?.error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive">Failed to load posts</div>
        <div className="text-sm text-muted-foreground mt-1">{data?.error ?? String(error)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <TagsManager tags={data.tags ?? []} />
      <PostFilters />
      <PostsTable posts={data.posts ?? []} totalCount={data.totalCount ?? 0} currentPage={page} />
    </div>
  )
}
