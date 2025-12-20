import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://vibedevid.com'
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${base.replace(/\/$/, '')}/sitemap.xml`,
    host: base.replace(/\/$/, ''),
  }
}
