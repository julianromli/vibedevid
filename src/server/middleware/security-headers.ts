import { randomBytes } from 'node:crypto'
import type { MiddlewareHandler } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { getSupabaseConfig } from '@/lib/env-config'
import { getSiteUrl } from '@/lib/seo/site-url'

function originFromUrl(url: string): string | null {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return null
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

function buildConnectSrc(): string[] {
  const siteOrigin = originFromUrl(getSiteUrl())
  const supabaseOrigin = originFromUrl(getSupabaseConfig().url)

  return [
    "'self'",
    siteOrigin,
    supabaseOrigin,
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://uploadthing.com',
    'https://*.uploadthing.com',
    'https://*.ingest.uploadthing.com',
    'https://api.github.com',
    'https://www.googleapis.com',
    'https://vitals.vercel-insights.com',
  ].filter((value): value is string => Boolean(value))
}

/**
 * Security headers per https://hono.dev/docs/middleware/builtin/secure-headers
 */
export function securityHeadersMiddleware(): MiddlewareHandler {
  const isProduction = process.env.NODE_ENV === 'production'
  const connectSrc = buildConnectSrc()

  return async (c, next) => {
    const nonce = randomBytes(16).toString('base64')
    c.set('cspNonce', nonce)

    const scriptSrc = isProduction
      ? ["'self'", `'nonce-${nonce}'`]
      : ["'self'", "'unsafe-inline'"]

    const middleware = secureHeaders({
      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
      strictTransportSecurity: isProduction ? 'max-age=31536000; includeSubDomains' : false,
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        objectSrc: ["'none'"],
        scriptSrc,
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        fontSrc: ["'self'", 'https:', 'data:'],
        connectSrc,
        frameSrc: ["'self'", 'https://www.youtube.com', 'https://youtube.com', 'https://www.youtube-nocookie.com'],
        mediaSrc: ["'self'", 'https:'],
        ...(isProduction ? { upgradeInsecureRequests: [] } : {}),
      },
    })

    return middleware(c, next)
  }
}
