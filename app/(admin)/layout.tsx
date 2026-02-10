import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/user'
import DashboardLayoutClient from './layout-client'

export const dynamic = 'force-dynamic'

interface Props {
  children: React.ReactNode
}

// Role constants - Admin is role 0
const ROLES = {
  ADMIN: 0,
  MODERATOR: 1,
  USER: 2,
} as const

export default async function DashboardLayout({ children }: Props) {
  const { user, error } = await getCurrentUser()

  if (error || !user) {
    redirect('/user/auth')
  }

  // CRITICAL-3: Verify user has admin role before granting access
  if (user.role !== ROLES.ADMIN) {
    redirect('/')
  }

  return <DashboardLayoutClient user={user}>{children}</DashboardLayoutClient>
}
