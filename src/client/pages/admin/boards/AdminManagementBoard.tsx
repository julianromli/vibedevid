'use client'

import { useQuery } from '@tanstack/react-query'
import { AdminManagementBoard as AdminManagementPanel } from '@/app/(admin)/dashboard/boards/admin-management/components/admin-management-board'
import { Skeleton } from '@/components/ui/skeleton'

export function AdminManagementBoard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'admins'],
    queryFn: async () => {
      const res = await fetch('/api/admin/admins', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load admins')
      return res.json()
    },
  })

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  if (error || data?.error || data?.success === false) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive">Failed to load admin users</div>
        <div className="text-sm text-muted-foreground mt-1">{data?.error ?? String(error)}</div>
      </div>
    )
  }

  return (
    <AdminManagementPanel
      initialUsers={data.users ?? []}
      adminCount={data.adminCount ?? 0}
      moderatorCount={data.moderatorCount ?? 0}
    />
  )
}
