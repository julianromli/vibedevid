import { createFileRoute } from '@tanstack/react-router'
import { getCachedApprovedEvents } from '@/lib/server/events-public'
import EventListClient from '@/app/event/list/event-list-client'

export const Route = createFileRoute('/event/list')({
  loader: async () => {
    const initialEvents = await getCachedApprovedEvents()
    return { initialEvents: initialEvents || [] }
  },
  component: EventListRoute,
})

function EventListRoute() {
  const { initialEvents } = Route.useLoaderData()

  return <EventListClient initialEvents={initialEvents} />
}
