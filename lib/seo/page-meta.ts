import { absoluteUrl, getSiteUrl } from '@/lib/seo/site-url'

type HeadMeta = { title: string } | { name: string; content: string } | { property: string; content: string }

interface PublicPageHeadInput {
  title: string
  description: string
  /** Path beginning with `/`. Use `/` for the homepage. */
  path: string
  /** Absolute image URL. Empty values fall back to the site OG image. */
  image?: string | null
  type?: 'website' | 'article' | 'profile'
  locale?: 'id_ID' | 'en_US'
}

/**
 * Title, description, canonical, Open Graph, and Twitter tags for one public page.
 * Child route meta replaces the root tag with the same `name` or `property`.
 */
export function publicPageHead({
  title,
  description,
  path,
  image,
  type = 'website',
  locale = 'id_ID',
}: PublicPageHeadInput): {
  meta: HeadMeta[]
  links: Array<{ rel: 'canonical'; href: string }>
} {
  const url = path === '/' ? getSiteUrl() : absoluteUrl(path)
  const trimmedDescription = description.trim() || title
  const ogImage = image?.trim() ? image.trim() : absoluteUrl('/og-image.png')
  const usingDefaultImage = ogImage === absoluteUrl('/og-image.png')

  return {
    meta: [
      { title },
      { name: 'description', content: trimmedDescription },
      { property: 'og:title', content: title },
      { property: 'og:description', content: trimmedDescription },
      { property: 'og:url', content: url },
      { property: 'og:type', content: type },
      { property: 'og:locale', content: locale },
      { property: 'og:image', content: ogImage },
      { property: 'og:image:alt', content: title },
      ...(usingDefaultImage
        ? [
            { property: 'og:image:type', content: 'image/png' },
            { property: 'og:image:width', content: '1200' },
            { property: 'og:image:height', content: '630' },
          ]
        : []),
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: trimmedDescription },
      { name: 'twitter:image', content: ogImage },
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}
