import type { EventFormData } from '@/types/events'

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

/**
 * Generate URL-friendly slug from event name
 * - Converts to lowercase
 * - Replaces spaces and special chars with hyphens
 * - Removes consecutive hyphens
 * - Removes leading/trailing hyphens
 */
export function generateEventSlug(name: string): string {
  if (!name || typeof name !== 'string') return ''

  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace consecutive hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Validate URL format (must start with http:// or https://)
 */
export function validateURL(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  return /^https?:\/\/.+/.test(url)
}

/**
 * Validate event form data
 * Returns validation result with errors for each invalid field
 */
export function validateEventForm(data: Partial<EventFormData>): ValidationResult {
  const errors: Record<string, string> = {}

  // Required field validations
  if (!data.name?.trim()) {
    errors.name = 'Nama event wajib diisi'
  }

  if (!data.date?.trim()) {
    errors.date = 'Tanggal event wajib diisi'
  }

  if (!data.time?.trim()) {
    errors.time = 'Waktu event wajib diisi'
  }

  if (!data.locationType) {
    errors.locationType = 'Tipe lokasi wajib dipilih'
  }

  if (!data.locationDetail?.trim()) {
    errors.locationDetail = 'Detail lokasi wajib diisi'
  }

  if (!data.description?.trim()) {
    errors.description = 'Deskripsi event wajib diisi'
  }

  if (!data.organizer?.trim()) {
    errors.organizer = 'Nama penyelenggara wajib diisi'
  }

  if (!data.registrationUrl?.trim()) {
    errors.registrationUrl = 'URL registrasi wajib diisi'
  } else if (!validateURL(data.registrationUrl)) {
    errors.registrationUrl = 'URL registrasi harus format URL yang valid'
  }

  if (!data.coverImage?.trim()) {
    errors.coverImage = 'Cover image wajib diisi'
  }

  if (!data.category) {
    errors.category = 'Kategori event wajib dipilih'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
