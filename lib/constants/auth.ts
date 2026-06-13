import { absoluteUrl } from '@/lib/seo/site-url'

export const CONFIRM_EMAIL_COOKIE = 'confirm_email_hint'
export const CONFIRM_EMAIL_COOKIE_MAX_AGE_SECONDS = 5 * 60

const AUTH_CALLBACK_PATH = '/auth/callback'

function ensureAuthCallbackPath(url: string): string {
  const trimmed = url.trim().replace(/\/$/, '')
  if (trimmed.endsWith(AUTH_CALLBACK_PATH)) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed)
    parsed.pathname = AUTH_CALLBACK_PATH
    parsed.search = ''
    parsed.hash = ''
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return `${trimmed}${AUTH_CALLBACK_PATH}`
  }
}

/** Server-side Supabase email/OAuth redirect target (signup confirm, resend, OAuth). */
export function getAuthCallbackUrl(options?: { next?: string }): string {
  const devRedirect = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL?.trim()
  const base = devRedirect ? ensureAuthCallbackPath(devRedirect) : absoluteUrl(AUTH_CALLBACK_PATH)

  const next = options?.next?.trim()
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return base
  }

  const url = new URL(base)
  url.searchParams.set('next', next)
  return url.toString()
}

/** Client-side Supabase email redirect target. */
export function getClientAuthCallbackUrl(origin?: string): string {
  const devRedirect = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL?.trim()
  if (devRedirect) {
    return ensureAuthCallbackPath(devRedirect)
  }

  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '')
  return base ? `${base}${AUTH_CALLBACK_PATH}` : AUTH_CALLBACK_PATH
}
