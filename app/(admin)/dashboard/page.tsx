import { Suspense } from 'react'
import { Header } from '@/components/admin-panel/header'
import { resolveDashboardTab, type DashboardTabValue } from '@/lib/admin/dashboard-tabs'
import Analytics from './boards/analytics'
import AdminManagementPage from './boards/admin-management/page'
import BlogPage from './boards/blog/page'
import CommentsPage from './boards/comments/page'
import EventsApproval from './boards/events-approval/page'
import Overview from './boards/overview'
import ProjectsPage from './boards/projects/page'
import UsersPage from './boards/users/page'
import { DashboardContent, DashboardContentFallback } from './components/dashboard-tabs'

interface SearchParams {
  search?: string
  role?: string
  status?: string
  page?: string
  tab?: string
  category?: string
}

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

async function DashboardTabPanel({
  tab,
  searchParams,
}: {
  tab: DashboardTabValue
  searchParams: Promise<SearchParams>
}) {
  switch (tab) {
    case 'overview':
      return <Overview />
    case 'analytics':
      return <Analytics />
    case 'events-approval':
      return <EventsApproval />
    case 'projects':
      return <ProjectsPage searchParams={searchParams} />
    case 'blog':
      return <BlogPage searchParams={searchParams} />
    case 'users':
      return <UsersPage searchParams={searchParams} />
    case 'admin-management':
      return <AdminManagementPage />
    case 'comments':
      return <CommentsPage searchParams={searchParams} />
    default:
      return <Overview />
  }
}

export default async function Dashboard1Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const activeTab = resolveDashboardTab(params.tab)

  return (
    <>
      <Header />

      <div
        className="space-y-4 p-4"
        suppressHydrationWarning
      >
        <div className="mb-2">
          <h1 className="text-2xl font-bold tracking-tight">{TAB_TITLES[activeTab]}</h1>
        </div>
        <Suspense fallback={<DashboardContentFallback />}>
          <DashboardContent>
            <DashboardTabPanel
              tab={activeTab}
              searchParams={searchParams}
            />
          </DashboardContent>
        </Suspense>
      </div>
    </>
  )
}
