'use client'

import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import EventDetailClient from '@/components/event/event-detail-client'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['event', slug],
    queryFn: async () => {
      const res = await fetch(`/api/pages/event/${slug}`, { credentials: 'include' })
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

  const event = data?.event
  if (isError || !event) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p>Event not found.</p>
          <Link to="/event/list" className="text-primary underline">
            Back to events
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <EventDetailClient
      event={event}
      relatedEvents={data.relatedEvents ?? []}
      currentUser={data.currentUser ?? null}
    />
  )
}
