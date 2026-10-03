import { serialize } from 'cookie-es'
import { LOCALE_COOKIE_MAX_AGE, LOCALE_COOKIE_NAME } from '@/lib/locale'

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

const PATH_ALIASES: Record<string, string> = {
  '/terms': '/terms-of-service',
  '/calendar': '/event/list',
}

/**
 * Collapse locale prefix, trailing slash, and known path aliases into one path.
 * Leaves API and asset paths unchanged.
 */
export function canonicalizePublicPath(pathname: string): { pathname: string; locale: 'en' | null } {
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_build') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/@')
  ) {
    return { pathname, locale: null }
  }

  let path = pathname
  let locale: 'en' | null = null

  if (path === '/en' || path.startsWith('/en/')) {
    const rest = path.slice('/en'.length)
    path = rest === '' ? '/' : rest
    locale = 'en'
  }

  if (path.length > 1 && path.endsWith('/')) {
    path = path.replace(/\/+$/, '') || '/'
  }

  const alias = PATH_ALIASES[path]
  if (alias) path = alias

  return { pathname: path, locale }
}

/** True when the path change is only the `/en` prefix, with no slash or alias change. */
function isLocaleOnlyPathChange(pathname: string): boolean {
  if (!(pathname === '/en' || pathname.startsWith('/en/'))) return false

  const rest = pathname.slice('/en'.length)
  const path = rest === '' ? '/' : rest
  if (path.length > 1 && path.endsWith('/')) return false
  if (PATH_ALIASES[path]) return false
  return true
}

export interface IndexableRedirect {
  location: string
  locale: 'en' | null
  /**
   * False when the only change is stripping `/en`. That redirect stays 302.
   * Host aliases, trailing slashes, and path aliases are permanent.
   */
  permanent: boolean
}

/**
 * One redirect target for alias hosts, DNS trailing-dot hosts, and public path
 * aliases. Host and path changes happen in the same response so Google does
 * not have to follow a chain.
 * Returns null when the request is already canonical.
 */
export function getIndexableRedirect(request: Request): IndexableRedirect | null {
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
  const hostNeedsRedirect = isAlias || isFqdnCanonical
  const nextPath = canonicalizePublicPath(requestUrl.pathname)
  const pathNeedsRedirect = nextPath.pathname !== requestUrl.pathname

  if (!hostNeedsRedirect && !pathNeedsRedirect) return null

  const origin = hostNeedsRedirect ? CANONICAL_SITE_ORIGIN : requestUrl.origin
  const localeOnly = nextPath.locale === 'en' && !hostNeedsRedirect && isLocaleOnlyPathChange(requestUrl.pathname)
  return {
    location: `${origin}${nextPath.pathname}${requestUrl.search}`,
    locale: nextPath.locale,
    permanent: !localeOnly,
  }
}

/** @see getIndexableRedirect */
export function getCanonicalHostRedirect(request: Request): string | null {
  return getIndexableRedirect(request)?.location ?? null
}

export function canonicalHostRedirectResponse(request: Request): Response | null {
  const target = getIndexableRedirect(request)
  if (!target) return null

  const method = request.method.toUpperCase()
  const isRead = method === 'GET' || method === 'HEAD'
  const status = target.permanent ? (isRead ? 301 : 308) : 302
  // A shared cache must not store a response that sets a cookie.
  const cacheControl = target.locale === 'en' ? 'private, no-store' : 'public, max-age=3600'
  const headers = new Headers({
    Location: target.location,
    'Cache-Control': cacheControl,
  })

  if (target.locale === 'en') {
    headers.append(
      'Set-Cookie',
      serialize(LOCALE_COOKIE_NAME, 'en', {
        path: '/',
        maxAge: LOCALE_COOKIE_MAX_AGE,
        sameSite: 'lax',
      }),
    )
  }

  return new Response(null, { status, headers })
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
