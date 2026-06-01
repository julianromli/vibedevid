'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import Overview from '@/app/(admin)/dashboard/boards/overview'
import Analytics from '@/app/(admin)/dashboard/boards/analytics'
import { Header } from '@/components/admin-panel/header'
import { resolveDashboardTab, type DashboardTabValue } from '@/lib/admin/dashboard-tabs'
import { DashboardContent, DashboardContentFallback } from '@/app/(admin)/dashboard/components/dashboard-tabs'
import { AdminManagementBoard } from '@/src/client/pages/admin/boards/AdminManagementBoard'
import { BlogBoard } from '@/src/client/pages/admin/boards/BlogBoard'
import { CommentsBoard } from '@/src/client/pages/admin/boards/CommentsBoard'
import { EventsBoard } from '@/src/client/pages/admin/boards/EventsBoard'
import { ProjectsBoard } from '@/src/client/pages/admin/boards/ProjectsBoard'
import { UsersBoard } from '@/src/client/pages/admin/boards/UsersBoard'

const TAB_TITLES: Record<DashboardTabValue, string> = {
  overview: 'Overview',
  analytics: 'Analytics',
  'events-approval': 'Events',
  projects: 'Projects',
  blog: 'Blog',
  users: 'Users',
  'admin-management': 'Admin management',
  comments: 'Comments',
}

function DashboardTabPanel({ tab }: { tab: DashboardTabValue }) {
  switch (tab) {
    case 'overview':
      return <Overview />
    case 'analytics':
      return <Analytics />
    case 'events-approval':
      return <EventsBoard />
    case 'projects':
      return <ProjectsBoard />
    case 'blog':
      return <BlogBoard />
    case 'users':
      return <UsersBoard />
    case 'admin-management':
      return <AdminManagementBoard />
    case 'comments':
      return <CommentsBoard />
    default:
      return <Overview />
  }
}

function AdminDashboardInner() {
  const [searchParams] = useSearchParams()
  const activeTab = resolveDashboardTab(searchParams.get('tab'))

  return (
    <>
      <Header />
      <div className="space-y-4 p-4" suppressHydrationWarning>
        <div className="mb-2">
          <h1 className="text-2xl font-bold tracking-tight">{TAB_TITLES[activeTab]}</h1>
        </div>
        <Suspense fallback={<DashboardContentFallback />}>
          <DashboardContent>
            <DashboardTabPanel tab={activeTab} />
          </DashboardContent>
        </Suspense>
      </div>
    </>
  )
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <AdminDashboardInner />
    </Suspense>
  )
}
