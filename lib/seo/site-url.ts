const DEFAULT_PRODUCTION_SITE_URL = 'https://www.vibedevid.com'
const DEFAULT_DEVELOPMENT_SITE_URL = 'http://localhost:3000'

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
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ]

  for (const candidate of candidates) {
    const url = normalizeUrl(candidate)
    if (!url) continue
    if (isLikelySupabaseUrl(url)) continue
    return url.toString().replace(/\/$/, '')
  }

  return process.env.NODE_ENV === 'development' ? DEFAULT_DEVELOPMENT_SITE_URL : DEFAULT_PRODUCTION_SITE_URL
}

export function absoluteUrl(pathname: string): string {
  const base = getSiteUrl()
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${base}${path}`
}
