import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { buildRobotsTxt } from '@/lib/seo/robots-txt'
import {
  absoluteUrl,
  CANONICAL_SITE_ORIGIN,
  canonicalHostRedirectResponse,
  getCanonicalHostRedirect,
  getSiteUrl,
  JOIN_COMMUNITY_URL,
} from '@/lib/seo/site-url'
import { buildSitemapXml } from '@/lib/seo/sitemap-xml'

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

  it('reads the Worker binding when process.env is empty', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('VITE_SITE_URL', '')
    vi.stubEnv('SITE_URL', '')
    ;(globalThis as { __env__?: Record<string, string> }).__env__ = {
      NEXT_PUBLIC_SITE_URL: 'https://www.vibedevid.com',
    }

    expect(getSiteUrl()).toBe(CANONICAL_SITE_ORIGIN)
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

  it('returns a 301 response for alias hosts', () => {
    const response = canonicalHostRedirectResponse(new Request('https://vibedevid.com/sitemap.xml'))
    expect(response?.status).toBe(301)
    expect(response?.headers.get('Location')).toBe(`${CANONICAL_SITE_ORIGIN}/sitemap.xml`)
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
    expect(body).not.toContain('vibedevid.com')
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
})
