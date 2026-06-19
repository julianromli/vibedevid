import { getPrivilegedUsers } from '@/lib/actions/admin/admins'
import { getReportedComments } from '@/lib/actions/admin/comments'
import { getAllPosts, getAllTags } from '@/lib/actions/admin/posts'
import { getAllProjects, getProjectCategories } from '@/lib/actions/admin/projects'
import { getAllUsers } from '@/lib/actions/admin/users'
import { getPendingEvents } from '@/lib/actions/events'
import type { DashboardTabValue } from '@/lib/admin/dashboard-tabs'

export interface DashboardSearchParams {
  search?: string
  role?: string
  status?: string
  page?: string
  tab?: string
  category?: string
}

function parsePage(page?: string): number {
  return page ? Number.parseInt(page, 10) || 1 : 1
}

/**
 * Fetch the data needed to render a single admin dashboard board, based on
 * the active tab and the current search params. Runs server-side from the
 * route loader. Returns `null` for tabs whose boards fetch their own data
 * client-side (overview, analytics).
 */
// biome-ignore lint/suspicious/noExplicitAny: board payloads are heterogeneous per tab
export async function loadDashboardBoardData(
  tab: DashboardTabValue,
  search: DashboardSearchParams,
): Promise<any> {
  const page = parsePage(search.page)

  switch (tab) {
    case 'projects': {
      const [{ projects, totalCount, error }, { categories }] = await Promise.all([
        getAllProjects(
          {
            status: search.status as 'all' | 'featured' | 'regular' | undefined,
            category: search.category,
            search: search.search,
          },
          page,
          20,
        ),
        getProjectCategories(),
      ])
      return { projects, totalCount, error, categories, page }
    }
    case 'blog': {
      const [{ posts, totalCount, error }, { tags }] = await Promise.all([
        getAllPosts(
          {
            status: search.status as 'all' | 'draft' | 'published' | 'archived' | undefined,
            search: search.search,
          },
          page,
          20,
        ),
        getAllTags(),
      ])
      return { posts, totalCount, error, tags, page }
    }
    case 'users': {
      const { users, totalCount, error } = await getAllUsers(
        {
          search: search.search,
          role: search.role as 'all' | 'admin' | 'moderator' | 'user' | undefined,
          status: search.status as 'all' | 'active' | 'suspended' | undefined,
        },
        page,
        20,
      )
      return { users, totalCount, error, page }
    }
    case 'comments': {
      const { reports, totalCount, error } = await getReportedComments(
        { status: search.status as 'all' | 'pending' | 'reviewed' | 'dismissed' | undefined },
        page,
        20,
      )
      return { reports, totalCount, error, page }
    }
    case 'events-approval': {
      const { events, error } = await getPendingEvents()
      return { events, error }
    }
    case 'admin-management': {
      const result = await getPrivilegedUsers()
      return { result }
    }
    default:
      return null
  }
}
