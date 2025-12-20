import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { createClient } from '@/lib/supabase/server'

const f = createUploadthing()

async function requireAuthenticatedUserId() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('You must be logged in to upload files')
  }

  return user.id
}

function getUfsUrl(file: unknown): string | undefined {
  if (!file || typeof file !== 'object') return undefined
  const ufsUrl = (file as Record<string, unknown>).ufsUrl
  return typeof ufsUrl === 'string' ? ufsUrl : undefined
}

export const ourFileRouter = {
  projectImageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      console.log('[UploadThing] middleware called (projectImageUploader)')

      try {
        const userId = await requireAuthenticatedUserId()
        console.log('[UploadThing] authenticated user:', userId)
        return { userId }
      } catch (error) {
        console.error('[UploadThing] middleware error:', error)
        throw error
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(
        '[UploadThing] upload complete (projectImageUploader) for userId:',
        metadata.userId,
      )

      const ufsUrl = getUfsUrl(file)
      const url = ufsUrl ?? file.url

      return {
        uploadedBy: metadata.userId,
        url,
        ufsUrl,
        key: file.key,
        name: file.name,
      }
    }),

  blogImageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      console.log('[UploadThing] middleware called (blogImageUploader)')

      try {
        const userId = await requireAuthenticatedUserId()
        console.log('[UploadThing] authenticated user:', userId)
        return { userId }
      } catch (error) {
        console.error('[UploadThing] middleware error:', error)
        throw error
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(
        '[UploadThing] upload complete (blogImageUploader) for userId:',
        metadata.userId,
      )

      const ufsUrl = getUfsUrl(file)
      const url = ufsUrl ?? file.url

      return {
        uploadedBy: metadata.userId,
        url,
        ufsUrl,
        key: file.key,
        name: file.name,
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
