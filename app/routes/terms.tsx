import { createFileRoute } from '@tanstack/react-router'
import TermsPage from '@/app/terms/page'

export const Route = createFileRoute('/terms')({
  component: TermsRoute,
})

function TermsRoute() {
  return <TermsPage />
}
