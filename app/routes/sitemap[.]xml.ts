import { createFileRoute } from '@tanstack/react-router'
import { getSiteUrl } from '@/lib/seo/site-url'

const STATIC_ROUTES = [
  '',
  '/project/list',
  '/project/submit',
  '/user/auth',
  '/terms',
  '/privacy-policy',
  '/terms-of-service',
  '/calendar',
  '/blog',
  '/event/list',
]

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const base = getSiteUrl().replace(/\/$/, '')
        const lastModified = new Date().toISOString()

        const urls = STATIC_ROUTES.map((path) => {
          const loc = `${base}${path}`
          const priority = path === '' ? '1.0' : '0.6'
          return `<url><loc>${loc}</loc><lastmod>${lastModified}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>`
        }).join('')

        const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`

        return new Response(body, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
          },
        })
      },
    },
  },
})
