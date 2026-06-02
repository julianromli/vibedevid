'use client'

import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { UserSearch } from '@/src/client/features/admin/boards/users/UserSearch'
import { UsersTable } from '@/src/client/features/admin/boards/users/UsersTable'
import { Skeleton } from '@/components/ui/skeleton'

export function UsersBoard() {
  const [searchParams] = useSearchParams()
  const search = searchParams.get('search') ?? undefined
  const role = searchParams.get('role') ?? undefined
  const status = searchParams.get('status') ?? undefined
  const page = searchParams.get('page') ? Number.parseInt(searchParams.get('page')!, 10) : 1

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users', search, role, status, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (role) params.set('role', role)
      if (status) params.set('status', status)
      if (page > 1) params.set('page', String(page))
      const res = await fetch(`/api/admin/users?${params}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load users')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || data?.error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive">Failed to load users</div>
        <div className="text-sm text-muted-foreground mt-1">{data?.error ?? String(error)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <UserSearch />
      <UsersTable users={data.users ?? []} totalCount={data.totalCount ?? 0} currentPage={page} />
    </div>
  )
}
