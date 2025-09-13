import { createRouteHandler } from 'uploadthing/next'
import { ourFileRouter } from '@/lib/uploadthing'

const uploadthingToken = process.env.UPLOADTHING_TOKEN?.trim()

// Log only the existence of token for debugging, not the value
if (!uploadthingToken) {
  console.error(
    '[UploadThing] Missing required environment variable: UPLOADTHING_TOKEN',
  )
  throw new Error('UPLOADTHING_TOKEN environment variable is required')
}

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    token: uploadthingToken,
  },
})
