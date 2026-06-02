import { mkdirSync, renameSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const dirs = [
  'src/client/styles',
  'src/client/features/home',
  'src/client/features/blog',
  'src/client/features/project',
  'src/client/features/profile',
  'src/client/features/auth',
  'src/client/features/admin/boards/events',
  'src/client/features/admin/boards/admin',
  'src/client/features/admin/boards/users',
  'src/client/features/admin/boards/projects',
  'src/client/features/admin/boards/comments',
  'src/client/features/admin/boards/blog',
]

for (const d of dirs) {
  mkdirSync(join(root, d), { recursive: true })
}

const moves = {
  'app/globals.css': 'src/client/styles/globals.css',
  'app/home-page-client.tsx': 'src/client/features/home/HomePageClient.tsx',
  'app/blog/blog-page-client.tsx': 'src/client/features/blog/BlogPageClient.tsx',
  'app/blog/editor/blog-editor-client.tsx': 'src/client/features/blog/BlogEditorClient.tsx',
  'app/project/list/project-list-client.tsx': 'src/client/features/project/ProjectListClient.tsx',
  'app/[username]/page.tsx': 'src/client/features/profile/ProfilePageClient.tsx',
  'app/user/auth/page.tsx': 'src/client/features/auth/AuthPageClient.tsx',
  'app/user/auth/confirm-email/page.tsx': 'src/client/pages/ConfirmEmailPage.tsx',
  'app/privacy-policy/privacy-policy-client.tsx': 'src/client/pages/PrivacyPolicyPage.tsx',
  'app/terms/page.tsx': 'src/client/pages/TermsPage.tsx',
  'app/terms-of-service/terms-of-service-client.tsx': 'src/client/pages/TermsOfServicePage.tsx',
  'app/calendar/page.tsx': 'src/client/pages/CalendarPage.tsx',
  'app/admin/page.tsx': 'src/client/pages/AdminVideoPage.tsx',
  'app/dashboard/posts/post-dashboard-client.tsx': 'src/client/pages/PostDashboardPage.tsx',
  'app/(admin)/layout-client.tsx': 'src/client/layouts/AdminLayoutClient.tsx',
  'app/(admin)/dashboard/components/dashboard-tabs.tsx': 'src/client/features/admin/DashboardContent.tsx',
  'app/(admin)/dashboard/boards/overview/index.tsx': 'src/client/features/admin/boards/OverviewBoard.tsx',
  'app/(admin)/dashboard/boards/analytics/index.tsx': 'src/client/features/admin/boards/AnalyticsBoard.tsx',
  'app/(admin)/dashboard/boards/events-approval/components/pending-events-table.tsx':
    'src/client/features/admin/boards/events/PendingEventsTable.tsx',
  'app/(admin)/dashboard/boards/admin-management/components/admin-management-board.tsx':
    'src/client/features/admin/boards/admin/AdminManagementBoard.tsx',
  'app/(admin)/dashboard/boards/users/components/user-search.tsx':
    'src/client/features/admin/boards/users/UserSearch.tsx',
  'app/(admin)/dashboard/boards/users/components/users-table.tsx':
    'src/client/features/admin/boards/users/UsersTable.tsx',
  'app/(admin)/dashboard/boards/users/components/user-actions.tsx':
    'src/client/features/admin/boards/users/UserActions.tsx',
  'app/(admin)/dashboard/boards/users/components/user-role-dialog.tsx':
    'src/client/features/admin/boards/users/UserRoleDialog.tsx',
  'app/(admin)/dashboard/boards/users/components/user-stats.tsx':
    'src/client/features/admin/boards/users/UserStats.tsx',
  'app/(admin)/dashboard/boards/users/components/user-suspend-dialog.tsx':
    'src/client/features/admin/boards/users/UserSuspendDialog.tsx',
  'app/(admin)/dashboard/boards/projects/components/project-filters.tsx':
    'src/client/features/admin/boards/projects/ProjectFilters.tsx',
  'app/(admin)/dashboard/boards/projects/components/projects-table.tsx':
    'src/client/features/admin/boards/projects/ProjectsTable.tsx',
  'app/(admin)/dashboard/boards/projects/components/project-actions.tsx':
    'src/client/features/admin/boards/projects/ProjectActions.tsx',
  'app/(admin)/dashboard/boards/projects/components/project-edit-dialog.tsx':
    'src/client/features/admin/boards/projects/ProjectEditDialog.tsx',
  'app/(admin)/dashboard/boards/comments/components/reports-table.tsx':
    'src/client/features/admin/boards/comments/ReportsTable.tsx',
  'app/(admin)/dashboard/boards/comments/components/comment-preview.tsx':
    'src/client/features/admin/boards/comments/CommentPreview.tsx',
  'app/(admin)/dashboard/boards/comments/components/report-actions.tsx':
    'src/client/features/admin/boards/comments/ReportActions.tsx',
  'app/(admin)/dashboard/boards/blog/components/post-filters.tsx':
    'src/client/features/admin/boards/blog/PostFilters.tsx',
  'app/(admin)/dashboard/boards/blog/components/posts-table.tsx':
    'src/client/features/admin/boards/blog/PostsTable.tsx',
  'app/(admin)/dashboard/boards/blog/components/post-actions.tsx':
    'src/client/features/admin/boards/blog/PostActions.tsx',
  'app/(admin)/dashboard/boards/blog/components/post-edit-dialog.tsx':
    'src/client/features/admin/boards/blog/PostEditDialog.tsx',
  'app/(admin)/dashboard/boards/blog/components/tags-manager.tsx':
    'src/client/features/admin/boards/blog/TagsManager.tsx',
}

for (const [src, dst] of Object.entries(moves)) {
  const from = join(root, src)
  const to = join(root, dst)
  if (!existsSync(from)) {
    console.warn(`MISSING: ${src}`)
    continue
  }
  mkdirSync(dirname(to), { recursive: true })
  renameSync(from, to)
  console.log(`Moved: ${src} -> ${dst}`)
}

console.log('Migration move complete')
