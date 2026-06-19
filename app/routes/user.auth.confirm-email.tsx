import { createFileRoute } from '@tanstack/react-router'
import ConfirmEmailPage from '@/app/user/auth/confirm-email/page'

export const Route = createFileRoute('/user/auth/confirm-email')({
  component: ConfirmEmailRoute,
})

function ConfirmEmailRoute() {
  return <ConfirmEmailPage />
}
