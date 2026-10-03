import { createFileRoute } from '@tanstack/react-router'
import EventListClient from '@/app/event/list/event-list-client'
import { publicPageHead } from '@/lib/seo/page-meta'
import { fetchApprovedEvents } from '@/lib/server/events-public'

export const Route = createFileRoute('/event/list')({
  // Mirror the previous server-side 60s cache: keep loader data fresh for 60s
  // before revalidating, and retain it in memory for 5 minutes.
  staleTime: 60_000,
  gcTime: 5 * 60_000,
  loader: async () => {
    const initialEvents = await fetchApprovedEvents()
    return { initialEvents: initialEvents || [] }
  },
  head: () =>
    publicPageHead({
      title: 'Event AI & Coding Indonesia | VibeDev ID',
      description: 'Daftar event, meetup, dan workshop seputar AI dan coding di Indonesia dari komunitas VibeDev ID.',
      path: '/event/list',
    }),
  component: EventListRoute,
})

function EventListRoute() {
  const { initialEvents } = Route.useLoaderData()

  return <EventListClient initialEvents={initialEvents} />
}
