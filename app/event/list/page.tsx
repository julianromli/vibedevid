import { getEvents } from '@/lib/actions/events'
import { getCurrentUser } from '@/lib/server/auth'
import EventListClient from './event-list-client'

export default async function EventListPage() {
  const user = await getCurrentUser()
  const { events: initialEvents } = await getEvents()

  return (
    <EventListClient
      initialIsLoggedIn={!!user}
      initialUser={user}
      initialEvents={initialEvents || []}
    />
  )
}
