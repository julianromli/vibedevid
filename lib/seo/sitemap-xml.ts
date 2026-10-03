import { escapeXml } from './escape-xml'

export interface SitemapEntry {
  loc: string
  /** Omit when the page has no real modification time. */
  lastmod?: string
  changefreq: string
  priority: string
}

/** ISO timestamp for sitemap `lastmod`, or undefined when the column is null. */
export function timestampToLastmod(value: unknown): string | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString()
  }
  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
  }
  return undefined
}

export function sitemapEntry(loc: string, changefreq: string, priority: string, lastmod?: string): SitemapEntry {
  if (!lastmod) return { loc, changefreq, priority }
  return { loc, changefreq, priority, lastmod }
}

export function sitemapSuccessResponse(xml: string): Response {
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

export function sitemapUnavailableResponse(): Response {
  return new Response('Sitemap temporarily unavailable', {
    status: 503,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''
      return `<url><loc>${escapeXml(entry.loc)}</loc>${lastmod}<changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
}
