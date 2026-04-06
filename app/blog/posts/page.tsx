import { redirect } from 'next/navigation'
import { Navbar } from '@/components/ui/navbar'
import { getCurrentUser } from '@/lib/actions/user'
import { PostDashboardClient } from './post-dashboard-client'

export const metadata = {
  title: 'Blog Dashboard | VibeDev ID',
  description: 'Manage your community blog posts',
}

export default async function BlogPostsPage() {
  const { user, error } = await getCurrentUser()

  if (error || !user) {
    redirect('/user/auth?redirectTo=/blog/posts')
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar
        isLoggedIn={true}
        user={user}
      />
      <main className="px-4 pt-20 pb-12 md:px-6">
        <div className="mx-auto max-w-7xl">
          <PostDashboardClient />
        </div>
      </main>
    </div>
  )
}
