import { getCachedApprovedEvents } from '@/lib/server/events-public'
import EventListClient from './event-list-client'

export default async function EventListPage() {
  const initialEvents = await getCachedApprovedEvents()

  return <EventListClient initialEvents={initialEvents || []} />
}
