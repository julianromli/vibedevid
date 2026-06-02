'use client'

import { useQuery } from '@tanstack/react-query'
import { PendingEventsTable } from '@/src/client/features/admin/boards/events/PendingEventsTable'
import { Skeleton } from '@/components/ui/skeleton'

export function EventsBoard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'events', 'pending'],
    queryFn: async () => {
      const res = await fetch('/api/admin/events/pending', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load pending events')
      return res.json()
    },
  })

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  if (error || data?.error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive">Failed to load events</div>
        <div className="text-sm text-muted-foreground mt-1">{data?.error ?? String(error)}</div>
      </div>
    )
  }

  return <PendingEventsTable events={data.events ?? []} />
}
