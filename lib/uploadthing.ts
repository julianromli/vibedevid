import { createUploadthing, type FileRouter, UTApi } from 'uploadthing/server'
import { createClient } from './supabase/server'
import type { OurFileRouter, UploadedFileMetadata } from './uploadthing-router'

export type { OurFileRouter } from './uploadthing-router'

const f = createUploadthing()

let utapiInstance: UTApi | null = null

function getUtApi() {
  if (!utapiInstance) {
    utapiInstance = new UTApi()
  }
  return utapiInstance
}

export type { UploadedFileMetadata } from './uploadthing-router'

export interface UploadCleanupResult {
  success: boolean
  deletedCount: number
}

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

export async function deleteUploadthingFiles(fileKeys: string | string[]): Promise<UploadCleanupResult> {
  const normalizedKeys = (Array.isArray(fileKeys) ? fileKeys : [fileKeys]).map((key) => key.trim()).filter(Boolean)

  if (normalizedKeys.length === 0) {
    return {
      success: true,
      deletedCount: 0,
    }
  }

  return getUtApi().deleteFiles(normalizedKeys)
}

export const ourFileRouter = {
  projectImageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 10 } })
    .middleware(async () => {
      const userId = await requireAuthenticatedUserId()
      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const ufsUrl = getUfsUrl(file)
      const url = ufsUrl ?? file.url

      const uploadedFile = {
        uploadedBy: metadata.userId,
        url,
        key: file.key,
        name: file.name,
      } satisfies UploadedFileMetadata

      return uploadedFile
    }),

  blogImageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      const userId = await requireAuthenticatedUserId()
      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const ufsUrl = getUfsUrl(file)
      const url = ufsUrl ?? file.url

      const uploadedFile = {
        uploadedBy: metadata.userId,
        url,
        key: file.key,
        name: file.name,
      } satisfies UploadedFileMetadata

      return uploadedFile
    }),
} satisfies FileRouter

// Keep the runtime router in sync with the client-safe `OurFileRouter` type
// declared in `./uploadthing-router`. If this assertion fails, the endpoint
// names or shapes have drifted and the type must be updated.
ourFileRouter satisfies OurFileRouter
