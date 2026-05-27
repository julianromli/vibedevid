import { Suspense } from 'react'
import { Header } from '@/components/admin-panel/header'
import { TabsContent } from '@/components/ui/tabs'
import Analytics from './boards/analytics'
import BlogPage from './boards/blog/page'
import CommentsPage from './boards/comments/page'
import EventsApproval from './boards/events-approval/page'
import Overview from './boards/overview'
import ProjectsPage from './boards/projects/page'
import UsersPage from './boards/users/page'
import { DashboardTabs, DashboardTabsFallback } from './components/dashboard-tabs'
import Dashboard1Actions from './components/dashboard-1-actions'

interface SearchParams {
  search?: string
  role?: string
  status?: string
  page?: string
  tab?: string
  category?: string
}

export default async function Dashboard1Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <Header />

      <div
        className="space-y-4 p-4"
        suppressHydrationWarning
      >
        <div className="mb-2 flex flex-col items-start justify-between space-y-2 md:flex-row md:items-center">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <Dashboard1Actions />
        </div>
        <Suspense fallback={<DashboardTabsFallback />}>
          <DashboardTabs>
            <TabsContent
              value="overview"
              className="space-y-4"
            >
              <Overview />
            </TabsContent>
            <TabsContent
              value="analytics"
              className="space-y-4"
            >
              <Analytics />
            </TabsContent>
            <TabsContent
              value="events-approval"
              className="space-y-4"
            >
              <EventsApproval />
            </TabsContent>
            <TabsContent
              value="projects"
              className="space-y-4"
            >
              <ProjectsPage searchParams={searchParams} />
            </TabsContent>
            <TabsContent
              value="blog"
              className="space-y-4"
            >
              <BlogPage searchParams={searchParams} />
            </TabsContent>
            <TabsContent
              value="users"
              className="space-y-4"
            >
              <UsersPage searchParams={searchParams} />
            </TabsContent>
            <TabsContent
              value="comments"
              className="space-y-4"
            >
              <CommentsPage searchParams={searchParams} />
            </TabsContent>
          </DashboardTabs>
        </Suspense>
      </div>
    </>
  )
}
