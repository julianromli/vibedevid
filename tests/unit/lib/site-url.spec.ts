import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { isReservedProfileSlug } from '@/lib/reserved-profile-slugs'
import { buildRobotsTxt } from '@/lib/seo/robots-txt'
import {
  absoluteUrl,
  CANONICAL_SITE_ORIGIN,
  canonicalHostRedirectResponse,
  getCanonicalHostRedirect,
  getSiteUrl,
  JOIN_COMMUNITY_URL,
} from '@/lib/seo/site-url'
import { buildSitemapXml, sitemapUnavailableResponse, timestampToLastmod } from '@/lib/seo/sitemap-xml'

afterEach(() => {
  vi.unstubAllEnvs()
  delete (globalThis as { __env__?: Record<string, string> }).__env__
})

describe('getSiteUrl', () => {
  it('rewrites the legacy domain and www to the canonical apex', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://vibedevid.com/')
    expect(getSiteUrl()).toBe(CANONICAL_SITE_ORIGIN)

    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.vibedeveloper.id')
    expect(getSiteUrl()).toBe(CANONICAL_SITE_ORIGIN)
  })

  it('strips a DNS trailing-dot FQDN before rewriting the origin', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://vibedevid.com.')
    expect(getSiteUrl()).toBe(CANONICAL_SITE_ORIGIN)

    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://vibedeveloper.id.')
    expect(getSiteUrl()).toBe(CANONICAL_SITE_ORIGIN)
  })

  it('reads the Worker binding when process.env is empty', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('VITE_SITE_URL', '')
    vi.stubEnv('SITE_URL', '')
    ;(globalThis as { __env__?: Record<string, string> }).__env__ = {
      NEXT_PUBLIC_SITE_URL: 'https://www.vibedevid.com',
    }

    expect(getSiteUrl()).toBe(CANONICAL_SITE_ORIGIN)
  })

  it('returns a default origin when process.env is missing', () => {
    // process exists (Node/Vitest). Only env is missing, as on some edge runtimes.
    const processRef = process as NodeJS.Process & { env?: NodeJS.ProcessEnv }
    const originalEnv = processRef.env
    processRef.env = undefined as unknown as NodeJS.ProcessEnv

    try {
      expect(getSiteUrl()).toMatch(/^https?:\/\/[^/]+$/)
    } finally {
      processRef.env = originalEnv
    }
  })

  it('keeps localhost for local development', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000')
    expect(getSiteUrl()).toBe('http://localhost:3000')
  })
})

describe('absoluteUrl', () => {
  it('builds a path on the canonical origin', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://vibedevid.com')
    expect(absoluteUrl('/blog/hello')).toBe(`${CANONICAL_SITE_ORIGIN}/blog/hello`)
  })
})

describe('getCanonicalHostRedirect', () => {
  it('301s alias hosts to the same path on the apex', () => {
    const request = new Request('https://www.vibedeveloper.id/blog/hello?ref=nav')
    expect(getCanonicalHostRedirect(request)).toBe(`${CANONICAL_SITE_ORIGIN}/blog/hello?ref=nav`)
  })

  it('uses the Host header when the request URL host differs', () => {
    const request = new Request('https://example.workers.dev/robots.txt', {
      headers: { host: 'vibedevid.com' },
    })
    expect(getCanonicalHostRedirect(request)).toBe(`${CANONICAL_SITE_ORIGIN}/robots.txt`)
  })

  it('does not redirect the canonical host or localhost', () => {
    expect(getCanonicalHostRedirect(new Request('https://vibedeveloper.id/blog'))).toBeNull()
    expect(getCanonicalHostRedirect(new Request('http://localhost:3000/'))).toBeNull()
  })

  it('collapses host, locale prefix, trailing slash, and path aliases into one hop', () => {
    expect(getCanonicalHostRedirect(new Request('https://www.vibedeveloper.id/en/calendar/?ref=nav'))).toBe(
      `${CANONICAL_SITE_ORIGIN}/event/list?ref=nav`,
    )
    expect(getCanonicalHostRedirect(new Request('https://vibedeveloper.id/blog/'))).toBe(
      `${CANONICAL_SITE_ORIGIN}/blog`,
    )
    expect(getCanonicalHostRedirect(new Request('https://vibedeveloper.id/terms'))).toBe(
      `${CANONICAL_SITE_ORIGIN}/terms-of-service`,
    )
    expect(getCanonicalHostRedirect(new Request('https://vibedevid.com/en/blog/'))).toBe(
      `${CANONICAL_SITE_ORIGIN}/blog`,
    )
    expect(getCanonicalHostRedirect(new Request('https://vibedeveloper.id/api/auth/sign-in/'))).toBeNull()
  })

  it('uses a temporary redirect and a private cache header when the only change is /en', () => {
    const response = canonicalHostRedirectResponse(new Request('https://vibedeveloper.id/en/blog?ref=nav'))
    expect(response?.status).toBe(302)
    expect(response?.headers.get('Location')).toBe(`${CANONICAL_SITE_ORIGIN}/blog?ref=nav`)
    expect(response?.headers.get('Cache-Control')).toBe('private, no-store')
    expect(response?.headers.get('set-cookie')).toContain('NEXT_LOCALE=en')
    expect(response?.headers.get('Cache-Control')).not.toContain('public')
  })

  it('keeps a public 301 for a trailing slash and does not set a cookie', () => {
    const response = canonicalHostRedirectResponse(new Request('https://vibedeveloper.id/blog/'))
    expect(response?.status).toBe(301)
    expect(response?.headers.get('Location')).toBe(`${CANONICAL_SITE_ORIGIN}/blog`)
    expect(response?.headers.get('Cache-Control')).toBe('public, max-age=3600')
    expect(response?.headers.get('set-cookie')).toBeNull()
  })

  it('uses 301 without a public cache when /en is combined with another canonical change', () => {
    const response = canonicalHostRedirectResponse(new Request('https://www.vibedeveloper.id/en/calendar/?ref=nav'))
    expect(response?.status).toBe(301)
    expect(response?.headers.get('Location')).toBe(`${CANONICAL_SITE_ORIGIN}/event/list?ref=nav`)
    expect(response?.headers.get('Cache-Control')).toBe('private, no-store')
    expect(response?.headers.get('set-cookie')).toContain('NEXT_LOCALE=en')
  })

  it('returns a 301 response for GET and HEAD on alias hosts', () => {
    const getResponse = canonicalHostRedirectResponse(new Request('https://vibedevid.com/sitemap.xml'))
    expect(getResponse?.status).toBe(301)
    expect(getResponse?.headers.get('Location')).toBe(`${CANONICAL_SITE_ORIGIN}/sitemap.xml`)

    const headResponse = canonicalHostRedirectResponse(
      new Request('https://www.vibedeveloper.id/sitemap.xml', { method: 'HEAD' }),
    )
    expect(headResponse?.status).toBe(301)
    expect(headResponse?.headers.get('Location')).toBe(`${CANONICAL_SITE_ORIGIN}/sitemap.xml`)
  })

  it('returns a 308 response for POST on alias hosts so the method is preserved', () => {
    const response = canonicalHostRedirectResponse(
      new Request('https://vibedevid.com/api/auth/sign-in', { method: 'POST' }),
    )
    expect(response?.status).toBe(308)
    expect(response?.headers.get('Location')).toBe(`${CANONICAL_SITE_ORIGIN}/api/auth/sign-in`)
  })

  it('redirects DNS trailing-dot alias and canonical hosts', () => {
    expect(getCanonicalHostRedirect(new Request('https://vibedevid.com./blog'))).toBe(`${CANONICAL_SITE_ORIGIN}/blog`)
    expect(
      getCanonicalHostRedirect(
        new Request('https://example.workers.dev/robots.txt', {
          headers: { host: 'www.vibedeveloper.id.' },
        }),
      ),
    ).toBe(`${CANONICAL_SITE_ORIGIN}/robots.txt`)
    expect(getCanonicalHostRedirect(new Request('https://vibedeveloper.id./event/list'))).toBe(
      `${CANONICAL_SITE_ORIGIN}/event/list`,
    )
  })
})

describe('JOIN_COMMUNITY_URL', () => {
  it('points at the WhatsApp subdomain of the canonical host', () => {
    expect(JOIN_COMMUNITY_URL).toBe('https://wa.vibedeveloper.id')
  })
})

describe('robots.txt', () => {
  it('advertises the canonical sitemap and host', () => {
    const body = buildRobotsTxt()
    expect(body).toContain(`Sitemap: ${CANONICAL_SITE_ORIGIN}/sitemap.xml`)
    expect(body).toContain(`Host: ${CANONICAL_SITE_ORIGIN}`)
    expect(body).not.toContain('User-agent: Googlebot')
    expect(body).toContain('Allow: /')
    expect(body).not.toMatch(/^Disallow: \/$/m)
    expect(body).not.toContain('vibedevid.com')
    expect(body).toContain('Disallow: /admin$')
    expect(body).toContain('Disallow: /admin/')
    expect(body).toContain('Disallow: /dashboard$')
    expect(body).toContain('Disallow: /dashboard/')
    expect(body).toContain('Disallow: /testimonial$')
    expect(body).toContain('Disallow: /testimonial/')
    expect(body).not.toMatch(/^Disallow: \/admin$/m)
    expect(body).not.toMatch(/^Disallow: \/dashboard$/m)
    expect(body).not.toMatch(/^Disallow: \/testimonial$/m)
  })

  it('blocks the same exact slugs the sitemap skips, and leaves longer profile names', () => {
    expect(isReservedProfileSlug('admin')).toBe(true)
    expect(isReservedProfileSlug('dashboard')).toBe(true)
    expect(isReservedProfileSlug('testimonial')).toBe(true)
    expect(isReservedProfileSlug('administrator')).toBe(false)
    expect(isReservedProfileSlug('testimonials')).toBe(false)
  })
})

describe('sitemap.xml', () => {
  it('emits well-formed URL entries', () => {
    const xml = buildSitemapXml([
      {
        loc: `${CANONICAL_SITE_ORIGIN}/blog/a&b`,
        lastmod: '2026-09-07T00:00:00.000Z',
        changefreq: 'weekly',
        priority: '0.7',
      },
    ])

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain(`<loc>${CANONICAL_SITE_ORIGIN}/blog/a&amp;b</loc>`)
    expect(xml).not.toContain('<loc>https://vibedevid.com')
  })

  it('omits lastmod when the page has no modification time', () => {
    const xml = buildSitemapXml([
      {
        loc: `${CANONICAL_SITE_ORIGIN}/privacy-policy`,
        changefreq: 'yearly',
        priority: '0.3',
      },
    ])
    expect(xml).not.toContain('<lastmod>')
  })

  it('omits lastmod for null timestamps and does not invent the current time', () => {
    expect(timestampToLastmod(null)).toBeUndefined()
    expect(timestampToLastmod(undefined)).toBeUndefined()
    expect(timestampToLastmod('')).toBeUndefined()
    expect(timestampToLastmod(new Date('2026-01-02T03:04:05.000Z'))).toBe('2026-01-02T03:04:05.000Z')
  })

  it('returns 503 with no-store when the sitemap cannot be built', () => {
    const response = sitemapUnavailableResponse()
    expect(response.status).toBe(503)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })
})
