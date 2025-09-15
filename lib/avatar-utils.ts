/**
 * Utility functions untuk mengelola avatar di Supabase storage
 * Termasuk auto-delete avatar lama untuk menghemat storage
 */

import { createClient } from '@/lib/supabase/client'

/**
 * Extract file path dari Supabase storage URL
 * @param url - Full URL dari file di Supabase storage
 * @param bucketName - Nama bucket (default: 'avatars')
 * @returns File path atau null jika bukan URL dari bucket kita
 */
export function extractStoragePathFromUrl(
  url: string,
  bucketName: string = 'avatars',
): string | null {
  if (!url) return null

  try {
    // Pattern untuk Supabase storage URL:
    // https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
    const supabaseStorageRegex = new RegExp(
      `/storage/v1/object/public/${bucketName}/(.+)`,
    )
    const match = url.match(supabaseStorageRegex)

    if (match && match[1]) {
      return match[1] // Return file path tanpa bucket name
    }

    return null // Bukan URL dari bucket kita, mungkin external URL
  } catch (error) {
    console.error('[Avatar Utils] Error extracting storage path:', error)
    return null
  }
}

/**
 * Delete file dari Supabase storage
 * @param filePath - Path file yang mau dihapus (tanpa bucket name)
 * @param bucketName - Nama bucket (default: 'avatars')
 * @returns Promise<boolean> - true jika berhasil dihapus
 */
export async function deleteStorageFile(
  filePath: string,
  bucketName: string = 'avatars',
): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage.from(bucketName).remove([filePath])

    if (error) {
      console.error(
        `[Avatar Utils] Error deleting file ${filePath}:`,
        error.message,
      )
      return false
    }

    console.log(`[Avatar Utils] Successfully deleted file: ${filePath}`)
    return true
  } catch (error) {
    console.error('[Avatar Utils] Unexpected error deleting file:', error)
    return false
  }
}

/**
 * Schedule deletion avatar lama dengan delay
 * @param oldAvatarUrl - URL avatar lama yang mau dihapus
 * @param delayMs - Delay dalam milliseconds (default: 10 detik)
 * @param bucketName - Nama bucket (default: 'avatars')
 */
export function scheduleOldAvatarDeletion(
  oldAvatarUrl: string,
  delayMs: number = 10000, // 10 detik default
  bucketName: string = 'avatars',
): void {
  // Validate URL dulu
  const filePath = extractStoragePathFromUrl(oldAvatarUrl, bucketName)

  if (!filePath) {
    console.log(
      '[Avatar Utils] Skipping deletion - not our storage file or invalid URL:',
      oldAvatarUrl,
    )
    return
  }

  console.log(
    `[Avatar Utils] Scheduling deletion of old avatar: ${filePath} in ${delayMs}ms`,
  )

  // Schedule deletion dengan setTimeout
  setTimeout(async () => {
    try {
      const success = await deleteStorageFile(filePath, bucketName)
      if (success) {
        console.log(
          `[Avatar Utils] ✅ Old avatar deleted successfully: ${filePath}`,
        )
      } else {
        console.log(
          `[Avatar Utils] ❌ Failed to delete old avatar: ${filePath}`,
        )
      }
    } catch (error) {
      console.error('[Avatar Utils] Error in scheduled deletion:', error)
    }
  }, delayMs)
}

/**
 * Check apakah URL adalah dari Supabase storage kita
 * @param url - URL yang mau dicek
 * @param bucketName - Nama bucket (default: 'avatars')
 * @returns boolean - true jika dari storage kita
 */
export function isOurStorageUrl(
  url: string,
  bucketName: string = 'avatars',
): boolean {
  return extractStoragePathFromUrl(url, bucketName) !== null
}
