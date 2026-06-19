import { createFileRoute } from '@tanstack/react-router'
import CalendarPage from '@/app/calendar/page'

export const Route = createFileRoute('/calendar')({
  component: CalendarRoute,
})

function CalendarRoute() {
  return <CalendarPage />
}
