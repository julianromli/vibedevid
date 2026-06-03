import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')

const importReplacements = [
  ["@/src/client/styles/globals.css", "@/src/client/styles/globals.css"],
  ["@/src/client/features/home/HomePageClient", "@/src/client/features/home/HomePageClient"],
  ["@/src/client/features/blog/BlogPageClient", "@/src/client/features/blog/BlogPageClient"],
  ["@/src/client/features/blog/BlogEditorClient", "@/src/client/features/blog/BlogEditorClient"],
  ["@/src/client/features/project/ProjectListClient", "@/src/client/features/project/ProjectListClient"],
  ["@/src/client/features/profile/ProfilePageClient", "@/src/client/features/profile/ProfilePageClient"],
  ["@/src/client/features/auth/AuthPageClient", "@/src/client/features/auth/AuthPageClient"],
  ["@/src/client/pages/ConfirmEmailPage", "@/src/client/pages/ConfirmEmailPage"],
  ["@/src/client/pages/PrivacyPolicyPage", "@/src/client/pages/PrivacyPolicyPage"],
  ["@/src/client/pages/TermsPage", "@/src/client/pages/TermsPage"],
  ["@/src/client/pages/TermsOfServicePage", "@/src/client/pages/TermsOfServicePage"],
  ["@/src/client/pages/CalendarPage", "@/src/client/pages/CalendarPage"],
  ["@/src/client/pages/AdminVideoPage", "@/src/client/pages/AdminVideoPage"],
  ["@/src/client/pages/PostDashboardPage", "@/src/client/pages/PostDashboardPage"],
  ["@/src/client/layouts/AdminLayoutClient", "@/src/client/layouts/AdminLayoutClient"],
  ["@/src/client/features/admin/DashboardContent", "@/src/client/features/admin/DashboardContent"],
  ["@/src/client/features/admin/boards/OverviewBoard", "@/src/client/features/admin/boards/OverviewBoard"],
  ["@/src/client/features/admin/boards/AnalyticsBoard", "@/src/client/features/admin/boards/AnalyticsBoard"],
  [
    "@/src/client/features/admin/boards/events/PendingEventsTable",
    "@/src/client/features/admin/boards/events/PendingEventsTable",
  ],
  [
    "@/src/client/features/admin/boards/admin/AdminManagementBoard",
    "@/src/client/features/admin/boards/admin/AdminManagementBoard",
  ],
  [
    "@/src/client/features/admin/boards/users/UserSearch",
    "@/src/client/features/admin/boards/users/UserSearch",
  ],
  [
    "@/src/client/features/admin/boards/users/UsersTable",
    "@/src/client/features/admin/boards/users/UsersTable",
  ],
  [
    "@/src/client/features/admin/boards/projects/ProjectFilters",
    "@/src/client/features/admin/boards/projects/ProjectFilters",
  ],
  [
    "@/src/client/features/admin/boards/projects/ProjectsTable",
    "@/src/client/features/admin/boards/projects/ProjectsTable",
  ],
  [
    "@/src/client/features/admin/boards/comments/ReportsTable",
    "@/src/client/features/admin/boards/comments/ReportsTable",
  ],
  [
    "@/src/client/features/admin/boards/blog/PostFilters",
    "@/src/client/features/admin/boards/blog/PostFilters",
  ],
  [
    "@/src/client/features/admin/boards/blog/PostsTable",
    "@/src/client/features/admin/boards/blog/PostsTable",
  ],
  [
    "@/src/client/features/admin/boards/blog/TagsManager",
    "@/src/client/features/admin/boards/blog/TagsManager",
  ],
  ["from './PostActions'", "from './PostActions'"],
  ["from './PostEditDialog'", "from './PostEditDialog'"],
  ["from './UserActions'", "from './UserActions'"],
  ["from './UserRoleDialog'", "from './UserRoleDialog'"],
  ["from './UserStats'", "from './UserStats'"],
  ["from './UserSuspendDialog'", "from './UserSuspendDialog'"],
  ["from './ProjectActions'", "from './ProjectActions'"],
  ["from './ProjectEditDialog'", "from './ProjectEditDialog'"],
  ["from './CommentPreview'", "from './CommentPreview'"],
  ["from './ReportActions'", "from './ReportActions'"],
]

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (name === 'node_modules' || name === 'dist' || name === '.git') continue
      walk(p, files)
    } else if (['.ts', '.tsx', '.json', '.mjs'].includes(extname(name))) {
      files.push(p)
    }
  }
  return files
}

let changed = 0
for (const file of walk(root)) {
  let content = readFileSync(file, 'utf8')
  let updated = content
  for (const [from, to] of importReplacements) {
    updated = updated.split(from).join(to)
  }
  if (updated !== content) {
    writeFileSync(file, updated)
    changed++
    console.log(`Updated: ${file.replace(root + '\\', '').replace(root + '/', '')}`)
  }
}
console.log(`Import fix complete (${changed} files)`)
