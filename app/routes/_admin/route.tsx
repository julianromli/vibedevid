import { createServerFn } from '@tanstack/react-start'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getCurrentUser } from '@/lib/actions/user'
import DashboardLayoutClient from '@/app/(admin)/layout-client'

const ROLES = {
  ADMIN: 0,
  MODERATOR: 1,
  USER: 2,
} as const

/**
 * Server-only admin gate. Wrapped in `createServerFn` so the server-only
 * Supabase client never executes (or gets bundled) on the client when
 * `beforeLoad` re-runs during client-side navigation.
 */
const resolveAdminUser = createServerFn({ method: 'GET' }).handler(async () => {
  const { user, error } = await getCurrentUser()

  if (error || !user) {
    throw redirect({ to: '/user/auth' })
  }

  if (user.role !== ROLES.ADMIN) {
    throw redirect({ to: '/' })
  }

  return { user }
})

export const Route = createFileRoute('/_admin')({
  beforeLoad: async () => {
    return resolveAdminUser()
  },
  component: AdminLayoutRoute,
})

function AdminLayoutRoute() {
  const { user } = Route.useRouteContext()

  return (
    <DashboardLayoutClient user={user}>
      <Outlet />
    </DashboardLayoutClient>
  )
}
