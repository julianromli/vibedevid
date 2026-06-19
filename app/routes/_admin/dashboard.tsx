import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { Header } from '@/components/admin-panel/header'
import { type DashboardTabValue, resolveDashboardTab } from '@/lib/admin/dashboard-tabs'
import AdminManagementPage from '@/app/(admin)/dashboard/boards/admin-management/page'
import Analytics from '@/app/(admin)/dashboard/boards/analytics'
import BlogPage from '@/app/(admin)/dashboard/boards/blog/page'
import CommentsPage from '@/app/(admin)/dashboard/boards/comments/page'
import EventsApproval from '@/app/(admin)/dashboard/boards/events-approval/page'
import Overview from '@/app/(admin)/dashboard/boards/overview'
import ProjectsPage from '@/app/(admin)/dashboard/boards/projects/page'
import UsersPage from '@/app/(admin)/dashboard/boards/users/page'
import { DashboardContent, DashboardContentFallback } from '@/app/(admin)/dashboard/components/dashboard-tabs'
import { loadDashboardBoardData } from '@/app/(admin)/dashboard/dashboard-data'

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

// biome-ignore lint/suspicious/noExplicitAny: board payloads are heterogeneous per tab
function DashboardTabPanel({ tab, boardData }: { tab: DashboardTabValue; boardData: any }) {
  switch (tab) {
    case 'overview':
      return <Overview />
    case 'analytics':
      return <Analytics />
    case 'events-approval':
      return <EventsApproval {...boardData} />
    case 'projects':
      return <ProjectsPage {...boardData} />
    case 'blog':
      return <BlogPage {...boardData} />
    case 'users':
      return <UsersPage {...boardData} />
    case 'admin-management':
      return <AdminManagementPage {...boardData} />
    case 'comments':
      return <CommentsPage {...boardData} />
    default:
      return <Overview />
  }
}

export const Route = createFileRoute('/_admin/dashboard')({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    tab?: string
    search?: string
    role?: string
    status?: string
    page?: string
    category?: string
  } => ({
    tab: typeof search.tab === 'string' ? search.tab : undefined,
    search: typeof search.search === 'string' ? search.search : undefined,
    role: typeof search.role === 'string' ? search.role : undefined,
    status: typeof search.status === 'string' ? search.status : undefined,
    page: typeof search.page === 'string' ? search.page : undefined,
    category: typeof search.category === 'string' ? search.category : undefined,
  }),
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    const activeTab = resolveDashboardTab(deps.search.tab)
    const boardData = await loadDashboardBoardData(activeTab, deps.search)
    return { activeTab, boardData }
  },
  component: AdminDashboardRoute,
})

function AdminDashboardRoute() {
  const { activeTab, boardData } = Route.useLoaderData()

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
              boardData={boardData}
            />
          </DashboardContent>
        </Suspense>
      </div>
    </>
  )
}
