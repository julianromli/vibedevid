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

/**
 * Security headers per https://hono.dev/docs/middleware/builtin/secure-headers
 */
export function securityHeadersMiddleware() {
  const siteOrigin = originFromUrl(getSiteUrl())
  const supabaseOrigin = originFromUrl(getSupabaseConfig().url)
  const isProduction = process.env.NODE_ENV === 'production'

  const connectSrc = [
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

  return secureHeaders({
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
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      fontSrc: ["'self'", 'https:', 'data:'],
      connectSrc,
      frameSrc: ["'self'", 'https://www.youtube.com', 'https://youtube.com', 'https://www.youtube-nocookie.com'],
      mediaSrc: ["'self'", 'https:'],
      ...(isProduction ? { upgradeInsecureRequests: [] } : {}),
    },
  })
}
