import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardContentProps {
  children: ReactNode
}

/** Main dashboard panel wrapper (navigation lives in the sidebar). */
export function DashboardContent({ children }: DashboardContentProps) {
  return <div className="space-y-4">{children}</div>
}

export function DashboardContentFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

// Kept for any stale imports during transition
export const DashboardTabs = DashboardContent
export const DashboardTabsFallback = DashboardContentFallback
