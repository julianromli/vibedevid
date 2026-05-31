import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RootLayout } from './layouts/RootLayout'

const HomePage = lazy(() => import('./pages/HomePage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const ProjectListPage = lazy(() => import('./pages/ProjectListPage'))
const ProjectSubmitPage = lazy(() => import('./pages/ProjectSubmitPage'))
const BlogPage = lazy(() => import('./pages/BlogListPage'))
const ConfirmEmailPage = lazy(() => import('@/app/user/auth/confirm-email/page'))
const PrivacyPage = lazy(() => import('@/app/privacy-policy/privacy-policy-client'))
const TermsPage = lazy(() => import('@/app/terms/page'))
const TermsServicePage = lazy(() => import('@/app/terms-of-service/terms-of-service-client'))
const CalendarPage = lazy(() => import('@/app/calendar/page'))
const AdminVideoPage = lazy(() => import('@/app/admin/page'))
const PostDashboardPage = lazy(() => import('@/app/dashboard/posts/post-dashboard-client'))
const BlogEditorPage = lazy(() => import('@/app/blog/editor/blog-editor-client'))
const BlogEditorSlugPage = lazy(() => import('@/app/blog/editor/blog-editor-client'))
const BlogSlugPage = lazy(() => import('./pages/BlogDetailPage'))
const EventListPage = lazy(() => import('./pages/EventListPage'))
const EventSlugPage = lazy(() => import('./pages/EventDetailPage'))
const ProjectSlugPage = lazy(() => import('./pages/ProjectDetailPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminProjectsPage = lazy(() => import('./pages/admin/AdminProjectsPage'))
const AdminBlogPage = lazy(() => import('./pages/admin/AdminBlogPage'))
const AdminCommentsPage = lazy(() => import('./pages/admin/AdminCommentsPage'))
const AdminEventsPage = lazy(() => import('./pages/admin/AdminEventsPage'))
const AdminManagementPage = lazy(() => import('./pages/admin/AdminManagementPage'))

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
  return (
    <S>
      <ProfilePage />
    </S>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <S><HomePage /></S> },
      { path: 'en', element: <S><HomePage /></S> },
      { path: 'user/auth', element: <S><AuthPage /></S> },
      { path: 'user/auth/confirm-email', element: <S><ConfirmEmailPage /></S> },
      { path: 'auth/callback', element: <Navigate to="/" replace /> },
      { path: 'project/list', element: <S><ProjectListPage /></S> },
      { path: 'project/submit', element: <S><ProjectSubmitPage /></S> },
      { path: 'project/:slug', element: <S><ProjectSlugPage /></S> },
      { path: 'blog', element: <S><BlogPage /></S> },
      { path: 'blog/editor', element: <S><BlogEditorPage /></S> },
      { path: 'blog/editor/:slug', element: <S><BlogEditorSlugPage /></S> },
      { path: 'blog/:slug', element: <S><BlogSlugPage /></S> },
      { path: 'event/list', element: <S><EventListPage /></S> },
      { path: 'event/:slug', element: <S><EventSlugPage /></S> },
      { path: 'dashboard/posts', element: <S><PostDashboardPage /></S> },
      { path: 'admin', element: <S><AdminVideoPage /></S> },
      { path: 'admin/dashboard', element: <S><AdminDashboardPage /></S> },
      { path: 'admin/dashboard/boards/users', element: <S><AdminUsersPage /></S> },
      { path: 'admin/dashboard/boards/projects', element: <S><AdminProjectsPage /></S> },
      { path: 'admin/dashboard/boards/blog', element: <S><AdminBlogPage /></S> },
      { path: 'admin/dashboard/boards/comments', element: <S><AdminCommentsPage /></S> },
      { path: 'admin/dashboard/boards/events-approval', element: <S><AdminEventsPage /></S> },
      { path: 'admin/dashboard/boards/admin-management', element: <S><AdminManagementPage /></S> },
      { path: 'calendar', element: <S><CalendarPage /></S> },
      { path: 'privacy-policy', element: <S><PrivacyPage /></S> },
      { path: 'terms', element: <S><TermsPage /></S> },
      { path: 'terms-of-service', element: <S><TermsServicePage /></S> },
      {
        path: ':username',
        element: <UsernameRoute />,
        loader: ({ params }) => {
          if (RESERVED.has(params.username ?? '')) {
            throw new Response('Not Found', { status: 404 })
          }
          return null
        },
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
