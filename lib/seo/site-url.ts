const DEFAULT_PRODUCTION_SITE_URL = 'https://vibedeveloper.id'
const DEFAULT_DEVELOPMENT_SITE_URL = 'http://localhost:3000'

/** Apex host Google should index. No `www`, no legacy `vibedevid.com`. */
export const CANONICAL_SITE_HOST = 'vibedeveloper.id'
export const CANONICAL_SITE_ORIGIN = `https://${CANONICAL_SITE_HOST}`
export const JOIN_COMMUNITY_URL = 'https://wa.vibedeveloper.id'

/**
 * Hosts that serve (or used to serve) the same site. Requests to these hosts
 * redirect to {@link CANONICAL_SITE_ORIGIN} (301 for GET/HEAD, 308 otherwise).
 * `getSiteUrl()` also rewrites them so robots, sitemap, and canonical tags stay
 * on the apex even if an env var still holds the old domain.
 */
export const SITE_HOST_ALIASES = new Set(['www.vibedeveloper.id', 'vibedevid.com', 'www.vibedevid.com'])

type EnvRecord = Record<string, string | undefined>

function isLikelySupabaseUrl(url: URL): boolean {
  const host = normalizeHostname(url.hostname)
  return host.endsWith('.supabase.co') || host.endsWith('.supabase.in')
}

function readWorkerEnv(name: string): string | undefined {
  const cfEnv = (globalThis as { __env__?: EnvRecord }).__env__
  const value = cfEnv?.[name]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function readProcessEnv(name: string): string | undefined {
  if (typeof process === 'undefined') return undefined
  const value = process.env?.[name]
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function readViteSiteUrl(): string | undefined {
  try {
    const value = import.meta.env?.VITE_SITE_URL
    return typeof value === 'string' && value.trim() ? value : undefined
  } catch {
    return undefined
  }
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

/** Lowercase host and strip a DNS trailing-dot FQDN (`vibedevid.com.`). */
export function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.+$/, '')
}

function toCanonicalOrigin(url: URL): URL {
  const host = normalizeHostname(url.hostname)
  if (host === CANONICAL_SITE_HOST || SITE_HOST_ALIASES.has(host)) {
    url.hostname = CANONICAL_SITE_HOST
    url.protocol = 'https:'
    url.port = ''
  }
  return url
}

function originString(url: URL): string {
  return url.toString().replace(/\/$/, '')
}

function isDevelopmentRuntime(): boolean {
  if (readProcessEnv('NODE_ENV') === 'development') return true
  try {
    return import.meta.env?.DEV === true
  } catch {
    return false
  }
}

function requestHost(request: Request, requestUrl: URL): string {
  const header = request.headers.get('host')
  if (header) {
    return header.split(':')[0]?.toLowerCase() ?? requestUrl.hostname.toLowerCase()
  }
  return requestUrl.hostname.toLowerCase()
}

export function getSiteUrl(): string {
  const candidates = [
    readWorkerEnv('NEXT_PUBLIC_SITE_URL'),
    readWorkerEnv('VITE_SITE_URL'),
    readProcessEnv('NEXT_PUBLIC_SITE_URL'),
    readProcessEnv('SITE_URL'),
    readProcessEnv('VITE_SITE_URL'),
    readViteSiteUrl(),
  ]

  for (const candidate of candidates) {
    const url = normalizeUrl(candidate)
    if (!url) continue
    if (isLikelySupabaseUrl(url)) continue
    return originString(toCanonicalOrigin(url))
  }

  return isDevelopmentRuntime() ? DEFAULT_DEVELOPMENT_SITE_URL : DEFAULT_PRODUCTION_SITE_URL
}

export function absoluteUrl(pathname: string): string {
  const base = getSiteUrl()
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${base}${path}`
}

/**
 * Permanent redirect target when the request Host is a site alias, or the
 * canonical host in DNS trailing-dot form. Returns null for the bare canonical
 * host, localhost, and preview URLs.
 */
export function getCanonicalHostRedirect(request: Request): string | null {
  let requestUrl: URL
  try {
    requestUrl = new URL(request.url)
  } catch {
    return null
  }

  const rawHost = requestHost(request, requestUrl)
  const host = normalizeHostname(rawHost)
  const isAlias = SITE_HOST_ALIASES.has(host)
  const isFqdnCanonical = host === CANONICAL_SITE_HOST && rawHost !== host
  if (!isAlias && !isFqdnCanonical) return null

  return `${CANONICAL_SITE_ORIGIN}${requestUrl.pathname}${requestUrl.search}`
}

export function canonicalHostRedirectResponse(request: Request): Response | null {
  const location = getCanonicalHostRedirect(request)
  if (!location) return null

  const method = request.method.toUpperCase()
  const status = method === 'GET' || method === 'HEAD' ? 301 : 308

  return new Response(null, {
    status,
    headers: {
      Location: location,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

/**
 * Robots `noindex, nofollow` meta entry for private / non-indexable routes
 * (admin, dashboards, editors, auth screens). Spread into a route's
 * `head().meta` array.
 */
export const NOINDEX_META = {
  name: 'robots',
  content: 'noindex, nofollow',
} as const
