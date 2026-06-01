import { Hono } from 'hono'
import { resolveLocaleFromPath, resolvePageMeta } from '@/lib/seo/resolve-page-meta'
import { buildSitemapUrls, renderRobotsTxt, renderSitemapXml } from '@/lib/seo/sitemap'
import { getCookieLocale, runWithHonoRequestContext } from '@/src/server/lib/hono-request-context'
import { renderDocumentHtml } from '@/src/server/lib/index-html'
import { shouldHandleAsDocument, tryServeProductionStatic } from '@/src/server/lib/static-files'

export const seoRoutes = new Hono()

seoRoutes.get('/robots.txt', (c) => {
  return c.text(renderRobotsTxt(), 200, { 'Content-Type': 'text/plain; charset=utf-8' })
})

seoRoutes.get('/sitemap.xml', async (c) => {
  const urls = await buildSitemapUrls()
  return c.body(renderSitemapXml(urls), 200, { 'Content-Type': 'application/xml; charset=utf-8' })
})

seoRoutes.get('/api/seo/meta', async (c) => {
  const path = c.req.query('path') || '/'
  const locale = resolveLocaleFromPath(path, getCookieLocale(c))

  const meta = await runWithHonoRequestContext(c, () => resolvePageMeta(path, locale))
  return c.json(meta)
})

export async function documentHandler(c: import('hono').Context): Promise<Response | null> {
  const pathname = new URL(c.req.url).pathname

  if (!shouldHandleAsDocument(pathname)) {
    return null
  }

  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    return null
  }

  const accept = c.req.header('accept') ?? ''
  if (accept && !accept.includes('text/html') && !accept.includes('*/*') && accept.includes('application/json')) {
    return null
  }

  const staticResponse = await tryServeProductionStatic(c)
  if (staticResponse) return staticResponse

  const locale = resolveLocaleFromPath(pathname, getCookieLocale(c))
  const meta = await runWithHonoRequestContext(c, () => resolvePageMeta(pathname, locale))
  const html = await renderDocumentHtml(meta)

  if (c.req.method === 'HEAD') {
    return c.body(null, 200, { 'Content-Type': 'text/html; charset=utf-8' })
  }

  return c.html(html)
}
