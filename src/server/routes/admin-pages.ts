import { Hono } from 'hono'
import { getPrivilegedUsers } from '@/lib/actions/admin/admins'
import { getReportedComments } from '@/lib/actions/admin/comments'
import { getAllPosts, getAllTags } from '@/lib/actions/admin/posts'
import { getAllProjects, getProjectCategories } from '@/lib/actions/admin/projects'
import { getAllUsers } from '@/lib/actions/admin/users'
import { getPendingEvents } from '@/lib/actions/events'
import { isUser, requireAdmin } from '@/src/server/lib/require-admin'

export const adminPageRoutes = new Hono()

adminPageRoutes.use('*', async (c, next) => {
  const user = await requireAdmin(c)
  if (!isUser(user)) return user
  await next()
})

adminPageRoutes.get('/projects', async (c) => {
  const status = c.req.query('status') as 'all' | 'featured' | 'regular' | undefined
  const category = c.req.query('category')
  const search = c.req.query('search')
  const page = c.req.query('page') ? Number.parseInt(c.req.query('page')!, 10) : 1

  const [projectsResult, categoriesResult] = await Promise.all([
    getAllProjects({ status, category, search }, page, 20),
    getProjectCategories(),
  ])

  return c.json({
    projects: projectsResult.projects,
    totalCount: projectsResult.totalCount,
    error: projectsResult.error,
    categories: categoriesResult.categories ?? [],
  })
})

adminPageRoutes.get('/posts', async (c) => {
  const status = c.req.query('status') as 'all' | 'draft' | 'published' | 'archived' | undefined
  const search = c.req.query('search')
  const page = c.req.query('page') ? Number.parseInt(c.req.query('page')!, 10) : 1

  const [postsResult, tagsResult] = await Promise.all([
    getAllPosts({ status, search }, page, 20),
    getAllTags(),
  ])

  return c.json({
    posts: postsResult.posts,
    totalCount: postsResult.totalCount,
    error: postsResult.error,
    tags: tagsResult.tags ?? [],
  })
})

adminPageRoutes.get('/users', async (c) => {
  const role = c.req.query('role')
  const search = c.req.query('search')
  const status = c.req.query('status')
  const page = c.req.query('page') ? Number.parseInt(c.req.query('page')!, 10) : 1

  const filters = {
    role: role as 'all' | 'admin' | 'moderator' | 'user' | undefined,
    search,
    status: status as 'all' | 'active' | 'suspended' | undefined,
  }

  const result = await getAllUsers(filters, page, 20)
  return c.json(result)
})

adminPageRoutes.get('/comments', async (c) => {
  const status = c.req.query('status') as 'all' | 'pending' | 'reviewed' | 'dismissed' | undefined
  const page = c.req.query('page') ? Number.parseInt(c.req.query('page')!, 10) : 1

  const result = await getReportedComments({ status }, page, 20)
  return c.json(result)
})

adminPageRoutes.get('/events/pending', async (c) => {
  const result = await getPendingEvents()
  return c.json(result)
})

adminPageRoutes.get('/admins', async (c) => {
  const result = await getPrivilegedUsers()
  return c.json(result)
})
