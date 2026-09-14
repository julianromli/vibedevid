import { createFileRoute } from '@tanstack/react-router'
import { buildRobotsTxt } from '@/lib/seo/robots-txt'
import { getSiteUrl } from '@/lib/seo/site-url'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: async () => {
        return new Response(buildRobotsTxt(getSiteUrl()), {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          },
        })
      },
    },
  },
})
