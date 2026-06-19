import { createFileRoute } from '@tanstack/react-router'
import { getSiteUrl } from '@/lib/seo/site-url'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: async () => {
        const base = getSiteUrl().replace(/\/$/, '')

        const body = [`User-agent: *`, `Allow: /`, ``, `Sitemap: ${base}/sitemap.xml`, `Host: ${base}`].join('\n')

        return new Response(body, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        })
      },
    },
  },
})
