'use client'

import { Navigate, Outlet } from 'react-router-dom'
import DashboardLayoutClient from '@/app/(admin)/layout-client'
import { useAdminSession } from '@/src/client/hooks/use-admin-session'

export function AdminLayout() {
  const { user, isAdmin, isLoading } = useAdminSession()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/user/auth" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <DashboardLayoutClient user={user}>
      <Outlet />
    </DashboardLayoutClient>
  )
}
