import { useQuery } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'
import type { User } from '@/types/homepage'
import { AdminLayout } from './layouts/AdminLayout'
import { RootLayout } from './layouts/RootLayout'

const HomePage = lazy(() => import('./pages/HomePage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const ProjectListPage = lazy(() => import('./pages/ProjectListPage'))
const ProjectSubmitPage = lazy(() => import('./pages/ProjectSubmitPage'))
const BlogPage = lazy(() => import('./pages/BlogListPage'))
const ConfirmEmailPage = lazy(() => import('@/src/client/pages/ConfirmEmailPage'))
const PrivacyPage = lazy(() =>
  import('@/src/client/pages/PrivacyPolicyPage').then((m) => ({
    default: m.PrivacyPolicyClient,
  })),
)
const TermsPage = lazy(() => import('@/src/client/pages/TermsPage'))
const TermsServicePage = lazy(() =>
  import('@/src/client/pages/TermsOfServicePage').then((m) => ({
    default: m.TermsOfServiceClient,
  })),
)
const CalendarPage = lazy(() => import('@/src/client/pages/CalendarPage'))
const AdminVideoPage = lazy(() => import('@/src/client/pages/AdminVideoPage'))
const PostDashboardPage = lazy(() =>
  import('@/src/client/pages/PostDashboardPage').then((m) => ({ default: m.PostDashboardClient })),
)
const BlogEditorClient = lazy(() => import('@/src/client/features/blog/BlogEditorClient'))
const BlogSlugPage = lazy(() => import('./pages/BlogDetailPage'))
const EventListPage = lazy(() => import('./pages/EventListPage'))
const EventSlugPage = lazy(() => import('./pages/EventDetailPage'))
const ProjectSlugPage = lazy(() => import('./pages/ProjectDetailPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

const RESERVED = new Set([
  'project',
  'blog',
  'event',
  'user',
  'auth',
  'admin',
  'dashboard',
  'api',
  'en',
  'calendar',
  'terms',
  'privacy-policy',
  'terms-of-service',
])

function UsernameRoute() {
  const { username } = useParams<{ username: string }>()
  if (username && RESERVED.has(username)) {
    return (
      <S>
        <NotFoundPage />
      </S>
    )
  }

  return (
    <S>
      <ProfilePage />
    </S>
  )
}

function RedirectToDashboardTab({ tab }: { tab: string }) {
  return (
    <Navigate
      to={`/dashboard?tab=${tab}`}
      replace
    />
  )
}

function BlogEditorRoute() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async (): Promise<{ user: User | null }> => {
      const res = await fetch('/api/session', { credentials: 'include' })
      if (!res.ok) return { user: null }
      return res.json()
    },
  })

  if (isLoading) return <PageLoader />
  if (!data?.user)
    return (
      <Navigate
        to="/user/auth"
        replace
      />
    )

  return (
    <S>
      <BlogEditorClient
        user={data.user}
        mode={slug ? 'edit' : 'create'}
      />
    </S>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <S>
            <HomePage />
          </S>
        ),
      },
      {
        path: 'en',
        element: (
          <S>
            <HomePage />
          </S>
        ),
      },
      {
        path: 'user/auth',
        element: (
          <S>
            <AuthPage />
          </S>
        ),
      },
      {
        path: 'user/auth/confirm-email',
        element: (
          <S>
            <ConfirmEmailPage />
          </S>
        ),
      },
      {
        path: 'auth/callback',
        element: (
          <Navigate
            to="/"
            replace
          />
        ),
      },
      {
        path: 'project/list',
        element: (
          <S>
            <ProjectListPage />
          </S>
        ),
      },
      {
        path: 'project/submit',
        element: (
          <S>
            <ProjectSubmitPage />
          </S>
        ),
      },
      {
        path: 'project/:slug',
        element: (
          <S>
            <ProjectSlugPage />
          </S>
        ),
      },
      {
        path: 'blog',
        element: (
          <S>
            <BlogPage />
          </S>
        ),
      },
      { path: 'blog/editor', element: <BlogEditorRoute /> },
      { path: 'blog/editor/:slug', element: <BlogEditorRoute /> },
      {
        path: 'blog/:slug',
        element: (
          <S>
            <BlogSlugPage />
          </S>
        ),
      },
      {
        path: 'event/list',
        element: (
          <S>
            <EventListPage />
          </S>
        ),
      },
      {
        path: 'event/:slug',
        element: (
          <S>
            <EventSlugPage />
          </S>
        ),
      },
      {
        path: 'dashboard/posts',
        element: (
          <S>
            <PostDashboardPage />
          </S>
        ),
      },
      {
        path: 'admin',
        element: (
          <S>
            <AdminVideoPage />
          </S>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <S>
            <AdminLayout />
          </S>
        ),
        children: [
          {
            index: true,
            element: (
              <S>
                <AdminDashboardPage />
              </S>
            ),
          },
        ],
      },
      {
        path: 'admin/dashboard',
        element: (
          <Navigate
            to="/dashboard"
            replace
          />
        ),
      },
      { path: 'admin/dashboard/boards/users', element: <RedirectToDashboardTab tab="users" /> },
      { path: 'admin/dashboard/boards/projects', element: <RedirectToDashboardTab tab="projects" /> },
      { path: 'admin/dashboard/boards/blog', element: <RedirectToDashboardTab tab="blog" /> },
      { path: 'admin/dashboard/boards/comments', element: <RedirectToDashboardTab tab="comments" /> },
      { path: 'admin/dashboard/boards/events-approval', element: <RedirectToDashboardTab tab="events-approval" /> },
      { path: 'admin/dashboard/boards/admin-management', element: <RedirectToDashboardTab tab="admin-management" /> },
      {
        path: 'calendar',
        element: (
          <S>
            <CalendarPage />
          </S>
        ),
      },
      {
        path: 'privacy-policy',
        element: (
          <S>
            <PrivacyPage />
          </S>
        ),
      },
      {
        path: 'terms',
        element: (
          <S>
            <TermsPage />
          </S>
        ),
      },
      {
        path: 'terms-of-service',
        element: (
          <S>
            <TermsServicePage />
          </S>
        ),
      },
      {
        path: ':username',
        element: <UsernameRoute />,
      },
      {
        path: '*',
        element: (
          <S>
            <NotFoundPage />
          </S>
        ),
      },
    ],
  },
])
