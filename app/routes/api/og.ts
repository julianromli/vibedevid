import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/og')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { searchParams } = new URL(request.url)
        const title = searchParams.get('title')

        if (!title) {
          return new Response('Missing title', { status: 400 })
        }

        // OG image generation stubbed during TanStack Start migration.
        return new Response(`OG image stub for: ${title.slice(0, 140)}`, {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      },
    },
  },
})
