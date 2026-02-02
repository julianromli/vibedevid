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
import { Header } from '@/components/admin-panel/header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Analytics from './boards/analytics'
import BlogPage from './boards/blog/page'
import CommentsPage from './boards/comments/page'
import EventsApproval from './boards/events-approval/page'
import Overview from './boards/overview'
import ProjectsPage from './boards/projects/page'
import UsersPage from './boards/users/page'
import Dashboard1Actions from './components/dashboard-1-actions'

export default async function Dashboard1Page() {
  return (
    <>
      <Header />

      <div className="space-y-4 p-4">
        <div className="mb-2 flex flex-col items-start justify-between space-y-2 md:flex-row md:items-center">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <Dashboard1Actions />
        </div>
        <Tabs
          orientation="vertical"
          defaultValue="overview"
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
            <ProjectsPage searchParams={Promise.resolve({})} />
          </TabsContent>
          <TabsContent
            value="blog"
            className="space-y-4"
          >
            <BlogPage searchParams={Promise.resolve({})} />
          </TabsContent>
          <TabsContent
            value="users"
            className="space-y-4"
          >
            <UsersPage searchParams={Promise.resolve({})} />
          </TabsContent>
          <TabsContent
            value="comments"
            className="space-y-4"
          >
            <CommentsPage searchParams={Promise.resolve({})} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
