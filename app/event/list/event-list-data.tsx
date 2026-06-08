import { getCachedApprovedEvents } from '@/lib/server/events-public'
import EventListClient from './event-list-client'

export default async function EventListData() {
  const initialEvents = await getCachedApprovedEvents()

  return <EventListClient initialEvents={initialEvents || []} />
}
