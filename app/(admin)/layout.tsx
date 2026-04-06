import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/user'
import { getCurrentRoleAccess } from '@/lib/server/role-access'
import DashboardLayoutClient from './layout-client'

export const dynamic = 'force-dynamic'

interface Props {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: Props) {
  const [{ user, error }, access] = await Promise.all([getCurrentUser(), getCurrentRoleAccess()])

  if (error || !user || !access) {
    redirect('/user/auth?redirectTo=/dashboard')
  }

  if (!access.canAccessAdminDashboard) {
    redirect('/')
  }

  return (
    <DashboardLayoutClient
      user={user}
      isReadOnly={!access.canManageAdminDashboard}
    >
      {children}
    </DashboardLayoutClient>
  )
}
