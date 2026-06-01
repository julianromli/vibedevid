'use client'

import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ReportsTable } from '@/app/(admin)/dashboard/boards/comments/components/reports-table'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function CommentsBoard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = (searchParams.get('status') as 'all' | 'pending' | 'reviewed' | 'dismissed') || 'all'
  const page = searchParams.get('page') ? Number.parseInt(searchParams.get('page')!, 10) : 1
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'comments', status, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (status && status !== 'all') params.set('status', status)
      if (page > 1) params.set('page', String(page))
      const res = await fetch(`/api/admin/comments?${params}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load reports')
      return res.json()
    },
  })

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  if (error || data?.error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive">Failed to load comment reports</div>
        <div className="text-sm text-muted-foreground mt-1">{data?.error ?? String(error)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Select
        value={status}
        onValueChange={(value) => {
          const next = new URLSearchParams(searchParams)
          if (value === 'all') next.delete('status')
          else next.set('status', value)
          next.delete('page')
          setSearchParams(next)
        }}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filter status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="reviewed">Reviewed</SelectItem>
          <SelectItem value="dismissed">Dismissed</SelectItem>
        </SelectContent>
      </Select>
      <ReportsTable reports={data.reports ?? []} totalCount={data.totalCount ?? 0} currentPage={page} />
    </div>
  )
}
