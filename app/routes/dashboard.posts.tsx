import { createFileRoute } from '@tanstack/react-router'
import { PostDashboardClient } from '@/app/dashboard/posts/post-dashboard-client'

export const Route = createFileRoute('/dashboard/posts')({
  head: () => ({
    meta: [
      { title: 'Blog Dashboard | VibeDev ID' },
      { name: 'description', content: 'Manage your community blog posts' },
    ],
  }),
  component: DashboardPostsRoute,
})

function DashboardPostsRoute() {
  return <PostDashboardClient />
}
