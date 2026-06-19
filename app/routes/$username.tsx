import { createFileRoute } from '@tanstack/react-router'
import ProfilePage from '@/app/[username]/page'

export const Route = createFileRoute('/$username')({
  component: UsernameRoute,
})

function UsernameRoute() {
  const { username } = Route.useParams()
  return <ProfilePage key={username} />
}
