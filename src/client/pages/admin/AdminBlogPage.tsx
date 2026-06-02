'use client'
import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'

export default function AdminBlogPage() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: () => fetch('/api/session').then((r) => r.json()),
  })
  if (isLoading) return null
  if (!user?.user || user.user.role > 1)
    return (
      <Navigate
        to="/"
        replace
      />
    )
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">AdminBlogPage</h1>
      <p className="text-muted-foreground mt-2">Admin board — connect full UI from legacy dashboard components.</p>
    </div>
  )
}
