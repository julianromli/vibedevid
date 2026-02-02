import { getPendingEvents } from '@/lib/actions/events'
import { PendingEventsTable } from './components/pending-events-table'

export default async function EventsApprovalPage() {
  const { events, error } = await getPendingEvents()

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive">Failed to load pending events</div>
        <div className="text-sm text-muted-foreground mt-1">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PendingEventsTable events={events} />
    </div>
  )
}
