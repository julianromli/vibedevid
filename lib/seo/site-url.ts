const DEFAULT_PRODUCTION_SITE_URL = 'https://www.vibedevid.com'
const DEFAULT_DEVELOPMENT_SITE_URL = 'http://localhost:5173'

function readEnv(key: string): string {
  if (typeof process !== 'undefined' && process.env[key]) {
    return process.env[key] ?? ''
  }

  if (typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
    const value = import.meta.env[key as keyof ImportMetaEnv]
    return typeof value === 'string' ? value : ''
  }

  return ''
}

function isDevelopment(): boolean {
  if (typeof process !== 'undefined' && process.env.NODE_ENV) {
    return process.env.NODE_ENV === 'development'
  }

  return Boolean(import.meta.env?.DEV)
}

function isLikelySupabaseUrl(url: URL): boolean {
  const host = url.hostname.toLowerCase()
  return host.endsWith('.supabase.co') || host.endsWith('.supabase.in')
}

function normalizeUrl(input: string | undefined | null): URL | null {
  if (!input) return null

  const trimmed = input.trim()
  if (!trimmed) return null

  // Vercel commonly provides host-only env vars (no scheme)
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withScheme)
    url.hash = ''
    url.search = ''
    url.pathname = ''
    return url
  } catch {
    return null
  }
}

export function getSiteUrl(): string {
  const candidates = [
    readEnv('VITE_SITE_URL'),
    readEnv('VITE_PUBLIC_SITE_URL'),
    readEnv('NEXT_PUBLIC_SITE_URL'),
    readEnv('SITE_URL'),
    readEnv('VERCEL_PROJECT_PRODUCTION_URL'),
    readEnv('VERCEL_URL'),
  ]

  for (const candidate of candidates) {
    const url = normalizeUrl(candidate)
    if (!url) continue
    if (isLikelySupabaseUrl(url)) continue
    return url.toString().replace(/\/$/, '')
  }

  return isDevelopment() ? DEFAULT_DEVELOPMENT_SITE_URL : DEFAULT_PRODUCTION_SITE_URL
}

export function absoluteUrl(pathname: string): string {
  const base = getSiteUrl()
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${base}${path}`
}
