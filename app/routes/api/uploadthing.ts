import { createFileRoute } from '@tanstack/react-router'
import { createRouteHandler } from 'uploadthing/server'
import { ourFileRouter } from '@/lib/uploadthing'

function getUploadthingHandlers() {
  const uploadthingToken = process.env.UPLOADTHING_TOKEN?.trim()
  if (!uploadthingToken) {
    return null
  }

  return createRouteHandler({
    router: ourFileRouter,
    config: {
      token: uploadthingToken,
    },
  })
}

export const Route = createFileRoute('/api/uploadthing')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const handlers = getUploadthingHandlers()
        if (!handlers) {
          return Response.json({ error: 'Upload service not configured' }, { status: 503 })
        }
        return handlers(request)
      },
      POST: async ({ request }) => {
        const handlers = getUploadthingHandlers()
        if (!handlers) {
          return Response.json({ error: 'Upload service not configured' }, { status: 503 })
        }
        return handlers(request)
      },
    },
  },
})
