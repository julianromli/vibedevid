import { CANONICAL_SITE_ORIGIN } from '@/lib/seo/site-url'

/**
 * Paths blocked for the exact URL and for anything under that directory.
 * A bare prefix such as `Disallow: /admin` would also block `/administrator`.
 * `$` marks the end of the URL (Google and other major crawlers).
 */
const EXACT_OR_DIRECTORY_PATHS = [
  '/admin',
  '/dashboard',
  '/blog/editor',
  '/project/submit',
  '/testimonial',
  '/user/auth',
] as const

/** Already slash-bounded. These do not match a sibling path such as `/apricot`. */
const DIRECTORY_PATHS = ['/api/', '/auth/'] as const

function disallowLines(): string[] {
  const exact = EXACT_OR_DIRECTORY_PATHS.flatMap((path) => [`Disallow: ${path}$`, `Disallow: ${path}/`])
  return [...exact, ...DIRECTORY_PATHS.map((path) => `Disallow: ${path}`)]
}

export function buildRobotsTxt(origin = CANONICAL_SITE_ORIGIN): string {
  const base = origin.replace(/\/$/, '')
  return ['User-agent: *', 'Allow: /', ...disallowLines(), '', `Sitemap: ${base}/sitemap.xml`, `Host: ${base}`].join(
    '\n',
  )
}
