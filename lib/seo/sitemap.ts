import { createAdminClient } from '@/lib/supabase/admin'
import { absoluteUrl, getSiteUrl } from '@/lib/seo/site-url'

export interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function renderSitemapXml(urls: SitemapUrl[]): string {
  const body = urls
    .map((entry) => {
      const parts = [`    <loc>${xmlEscape(entry.loc)}</loc>`]
      if (entry.lastmod) parts.push(`    <lastmod>${entry.lastmod}</lastmod>`)
      if (entry.changefreq) parts.push(`    <changefreq>${entry.changefreq}</changefreq>`)
      if (entry.priority != null) parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`)
      return `  <url>\n${parts.join('\n')}\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

export async function buildSitemapUrls(): Promise<SitemapUrl[]> {
  const now = new Date().toISOString()
  const staticPaths = [
    '',
    '/project/list',
    '/project/submit',
    '/blog',
    '/event/list',
    '/user/auth',
    '/terms',
    '/privacy-policy',
    '/terms-of-service',
    '/calendar',
  ]

  const urls: SitemapUrl[] = staticPaths.map((path) => ({
    loc: absoluteUrl(path),
    lastmod: now,
    changefreq: 'weekly',
    priority: path === '' ? 1 : 0.6,
  }))

  try {
    const admin = createAdminClient()

    const [{ data: projects }, { data: posts }, { data: events }, { data: users }] = await Promise.all([
      admin.from('projects').select('slug, updated_at').order('updated_at', { ascending: false }).limit(5000),
      admin.from('posts').select('slug, updated_at').eq('status', 'published').order('updated_at', { ascending: false }).limit(2000),
      admin.from('events').select('slug, updated_at').eq('approved', true).order('updated_at', { ascending: false }).limit(2000),
      admin.from('users').select('username, updated_at').order('updated_at', { ascending: false }).limit(5000),
    ])

    for (const project of projects ?? []) {
      if (!project.slug) continue
      urls.push({
        loc: absoluteUrl(`/project/${project.slug}`),
        lastmod: project.updated_at ?? now,
        changefreq: 'weekly',
        priority: 0.8,
      })
    }

    for (const post of posts ?? []) {
      if (!post.slug) continue
      urls.push({
        loc: absoluteUrl(`/blog/${post.slug}`),
        lastmod: post.updated_at ?? now,
        changefreq: 'weekly',
        priority: 0.7,
      })
    }

    for (const event of events ?? []) {
      if (!event.slug) continue
      urls.push({
        loc: absoluteUrl(`/event/${event.slug}`),
        lastmod: event.updated_at ?? now,
        changefreq: 'weekly',
        priority: 0.7,
      })
    }

    for (const user of users ?? []) {
      if (!user.username) continue
      urls.push({
        loc: absoluteUrl(`/${user.username}`),
        lastmod: user.updated_at ?? now,
        changefreq: 'monthly',
        priority: 0.5,
      })
    }
  } catch (error) {
    console.error('[sitemap] dynamic entries failed:', error)
  }

  return urls
}

export function renderRobotsTxt(): string {
  const siteUrl = getSiteUrl()
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\nHost: ${siteUrl}\n`
}
