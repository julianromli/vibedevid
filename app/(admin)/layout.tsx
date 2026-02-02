import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/admin-panel/app-sidebar'
import { getCurrentUser } from '@/lib/actions/user'
import DashboardLayoutClient from './layout-client'

interface Props {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: Props) {
  const { user, error } = await getCurrentUser()

  if (error || !user) {
    redirect('/user/auth/login')
  }

  return <DashboardLayoutClient user={user}>{children}</DashboardLayoutClient>
}
