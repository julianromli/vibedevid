'use client'
import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { invokeRpc } from '@/lib/rpc-client'

export default function AdminDashboardPage() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: () => fetch('/api/session').then((r) => r.json()),
  })
  if (isLoading) return null
  if (!user?.user || user.user.role > 1) return <Navigate to="/" replace />
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">AdminDashboardPage</h1>
      <p className="text-muted-foreground mt-2">Admin board — connect full UI from legacy dashboard components.</p>
    </div>
  )
}
