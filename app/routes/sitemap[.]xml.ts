import { createFileRoute } from '@tanstack/react-router'
import { eq, isNotNull } from 'drizzle-orm'
import { isReservedProfileSlug } from '@/lib/reserved-profile-slugs'
import { getSiteUrl } from '@/lib/seo/site-url'
import {
  buildSitemapXml,
  type SitemapEntry,
  sitemapEntry,
  sitemapSuccessResponse,
  sitemapUnavailableResponse,
  timestampToLastmod,
} from '@/lib/seo/sitemap-xml'

const STATIC_ROUTES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: '', priority: '1.0', changefreq: 'daily' },
  { path: '/project/list', priority: '0.8', changefreq: 'daily' },
  { path: '/blog', priority: '0.8', changefreq: 'daily' },
  { path: '/event/list', priority: '0.7', changefreq: 'daily' },
  { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
  { path: '/terms-of-service', priority: '0.3', changefreq: 'yearly' },
]

function staticEntries(base: string): SitemapEntry[] {
  return STATIC_ROUTES.map((route) => sitemapEntry(`${base}${route.path}`, route.changefreq, route.priority))
}

/**
 * Published posts, approved events, public profiles, and projects.
 * `projects` has no draft, hidden, or published column. Every saved project is public.
 * `lastmod` is omitted when the row timestamp is null. It is never "now".
 */
async function getDynamicEntries(base: string): Promise<SitemapEntry[]> {
  const { getDb } = await import('@/lib/db')
  const { events, posts, projects, users } = await import('@/lib/db/schema')
  const db = getDb()

  const [postRows, projectRows, eventRows, userRows] = await Promise.all([
    db
      .select({ slug: posts.slug, updatedAt: posts.updatedAt, publishedAt: posts.publishedAt })
      .from(posts)
      .where(eq(posts.status, 'published')),
    db.select({ slug: projects.slug, updatedAt: projects.updatedAt }).from(projects),
    db
      .select({ slug: events.slug, updatedAt: events.updatedAt, createdAt: events.createdAt })
      .from(events)
      .where(eq(events.approved, true)),
    db.select({ username: users.username, updatedAt: users.updatedAt }).from(users).where(isNotNull(users.username)),
  ])

  const postEntries = postRows
    .filter((row) => row.slug)
    .map((row) =>
      sitemapEntry(`${base}/blog/${row.slug}`, 'weekly', '0.7', timestampToLastmod(row.updatedAt ?? row.publishedAt)),
    )

  const projectEntries = projectRows
    .filter((row) => row.slug)
    .map((row) => sitemapEntry(`${base}/project/${row.slug}`, 'weekly', '0.6', timestampToLastmod(row.updatedAt)))

  const eventEntries = eventRows
    .filter((row) => row.slug)
    .map((row) =>
      sitemapEntry(`${base}/event/${row.slug}`, 'weekly', '0.6', timestampToLastmod(row.updatedAt ?? row.createdAt)),
    )

  const userEntries = userRows
    .filter((row) => row.username && !isReservedProfileSlug(row.username))
    .map((row) => sitemapEntry(`${base}/${row.username}`, 'weekly', '0.4', timestampToLastmod(row.updatedAt)))

  return [...postEntries, ...projectEntries, ...eventEntries, ...userEntries]
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const base = getSiteUrl().replace(/\/$/, '')

        try {
          const dynamicEntries = await getDynamicEntries(base)
          return sitemapSuccessResponse(buildSitemapXml([...staticEntries(base), ...dynamicEntries]))
        } catch (error) {
          console.log('[sitemap] dynamic entries failed:', error)
          return sitemapUnavailableResponse()
        }
      },
    },
  },
})
