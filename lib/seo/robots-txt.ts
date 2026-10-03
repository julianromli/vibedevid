import { CANONICAL_SITE_ORIGIN } from '@/lib/seo/site-url'

/**
 * Private / non-indexable path prefixes. These either require auth, render
 * thin UI, or are API endpoints — none should appear in search results.
 */
const DISALLOWED_PATHS = [
  '/admin',
  '/dashboard',
  '/blog/editor',
  '/project/submit',
  '/testimonial',
  '/user/auth',
  '/api/',
  '/auth/',
]

function agentGroup(userAgent: string): string[] {
  return [`User-agent: ${userAgent}`, 'Allow: /', ...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`), '']
}

export function buildRobotsTxt(origin = CANONICAL_SITE_ORIGIN): string {
  const base = origin.replace(/\/$/, '')
  return [...agentGroup('*'), ...agentGroup('Googlebot'), `Sitemap: ${base}/sitemap.xml`, `Host: ${base}`].join('\n')
}
