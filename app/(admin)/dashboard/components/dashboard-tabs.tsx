'use client'

import {
  IconAnalyze,
  IconCalendarEvent,
  IconFileReport,
  IconFolder,
  IconMessageCircle,
  IconNews,
  IconNotification,
  IconSettings2,
  IconUsers,
} from '@tabler/icons-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { buildDashboardTabHref, resolveDashboardTab } from '@/lib/admin/dashboard-tabs'

interface DashboardTabsProps {
  children: ReactNode
}

export function DashboardTabs({ children }: DashboardTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeTab = resolveDashboardTab(searchParams.get('tab'))

  const handleTabChange = (value: string) => {
    router.push(buildDashboardTabHref(pathname, value), { scroll: false })
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="space-y-4"
    >
      <div className="w-full overflow-x-auto pb-2">
        <TabsList>
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2"
          >
            <IconSettings2 size={14} />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center gap-2"
          >
            <IconAnalyze size={16} />
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="flex items-center gap-2"
            disabled
          >
            <IconFileReport size={16} />
            Reports
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
            disabled
          >
            <IconNotification size={16} />
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="events-approval"
            className="flex items-center gap-2"
          >
            <IconCalendarEvent size={16} />
            Events
          </TabsTrigger>
          <TabsTrigger
            value="projects"
            className="flex items-center gap-2"
          >
            <IconFolder size={16} />
            Projects
          </TabsTrigger>
          <TabsTrigger
            value="blog"
            className="flex items-center gap-2"
          >
            <IconNews size={16} />
            Blog
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="flex items-center gap-2"
          >
            <IconUsers size={16} />
            Users
          </TabsTrigger>
          <TabsTrigger
            value="comments"
            className="flex items-center gap-2"
          >
            <IconMessageCircle size={16} />
            Comments
          </TabsTrigger>
        </TabsList>
      </div>
      {children}
    </Tabs>
  )
}

export function DashboardTabsFallback() {
  return (
    <div className="space-y-4">
      <div className="bg-muted h-9 w-full max-w-3xl animate-pulse rounded-lg" />
      <div className="bg-muted h-64 w-full animate-pulse rounded-lg" />
    </div>
  )
}
