import { createServerFn } from '@tanstack/react-start'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { z } from 'zod'
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

const dashboardSearchSchema = z.object({
  tab: z.string().optional(),
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  page: z.string().optional(),
  category: z.string().optional(),
})

/**
 * Server-only admin board data fetching. Wrapped in `createServerFn` so the
 * server-only data loaders never execute (or get bundled) on the client when
 * the loader re-runs during client-side navigation.
 */
const loadAdminDashboardData = createServerFn({ method: 'GET' })
  .validator(dashboardSearchSchema)
  .handler(async ({ data: search }) => {
    const activeTab = resolveDashboardTab(search.tab)
    const boardData = await loadDashboardBoardData(activeTab, search)
    return { activeTab, boardData }
  })

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
  loader: async ({ deps }) => loadAdminDashboardData({ data: deps.search }),
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
