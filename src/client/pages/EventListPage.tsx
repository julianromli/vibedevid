'use client'

import { useQuery } from '@tanstack/react-query'
import { PageLoadingShell } from '@/src/client/components/PageLoadingShell'
import EventListClient from '@/src/client/features/event/EventListClient'
import type { AIEvent } from '@/types/events'

export default function EventListPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['events'],
    queryFn: async (): Promise<{ events: AIEvent[] }> => {
      const res = await fetch('/api/pages/events')
      if (!res.ok) throw new Error('Failed to load events')
      return res.json()
    },
  })

  if (isLoading) {
    return <PageLoadingShell />
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">Gagal memuat daftar event.</p>
      </div>
    )
  }

  return <EventListClient initialEvents={data.events ?? []} />
}
