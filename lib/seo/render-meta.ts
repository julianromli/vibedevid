import { SITE_NAME, TWITTER_SITE } from '@/lib/seo/constants'
import { absoluteUrl } from '@/lib/seo/site-url'
import type { PageMeta } from '@/lib/seo/types'

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function toAbsoluteImage(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return absoluteUrl(url.startsWith('/') ? url : `/${url}`)
}

export function renderPageMetaTags(meta: PageMeta): string {
  const description = escapeHtml(meta.description)
  const canonical = escapeHtml(meta.canonical)
  const ogTitle = escapeHtml(meta.ogTitle ?? meta.title)
  const ogDescription = escapeHtml(meta.ogDescription ?? meta.description)
  const ogUrl = escapeHtml(meta.ogUrl ?? meta.canonical)
  const ogType = meta.ogType ?? 'website'
  const locale = meta.locale ?? 'id_ID'
  const robots = meta.robots ?? 'index, follow'
  const ogImage = meta.ogImage ? toAbsoluteImage(meta.ogImage) : absoluteUrl('/opengraph-image.png')
  const ogImageAlt = escapeHtml(meta.ogImageAlt ?? meta.title)

  const lines: string[] = [
    `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:title" content="${ogTitle}" />`,
    `<meta property="og:description" content="${ogDescription}" />`,
    `<meta property="og:url" content="${ogUrl}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="${locale}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${ogImageAlt}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:site" content="${TWITTER_SITE}" />`,
    `<meta name="twitter:creator" content="${TWITTER_SITE}" />`,
    `<meta name="twitter:title" content="${ogTitle}" />`,
    `<meta name="twitter:description" content="${ogDescription}" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`,
  ]

  if (meta.keywords?.length) {
    lines.push(`<meta name="keywords" content="${escapeHtml(meta.keywords.join(', '))}" />`)
  }

  if (meta.publishedTime && ogType === 'article') {
    lines.push(`<meta property="article:published_time" content="${escapeHtml(meta.publishedTime)}" />`)
  }

  for (const author of meta.authors ?? []) {
    lines.push(`<meta property="article:author" content="${escapeHtml(author)}" />`)
  }

  if (meta.jsonLd) {
    const blocks = Array.isArray(meta.jsonLd) ? meta.jsonLd : [meta.jsonLd]
    for (const block of blocks) {
      lines.push(`<script type="application/ld+json">${serializeJsonLd(block)}</script>`)
    }
  }

  return lines.join('\n    ')
}

export function injectPageMetaIntoHtml(html: string, meta: PageMeta): string {
  const tags = renderPageMetaTags(meta)
  const title = escapeHtml(meta.title)

  let out = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`)
  out = out.replace(/<html([^>]*)lang="[^"]*"/i, `<html$1 lang="${meta.locale?.startsWith('en') ? 'en' : 'id'}"`)

  if (out.includes('<!-- vibedev-seo -->')) {
    out = out.replace(
      /<!-- vibedev-seo -->[\s\S]*?<!-- \/vibedev-seo -->/,
      `<!-- vibedev-seo -->\n    ${tags}\n    <!-- /vibedev-seo -->`,
    )
  } else {
    out = out.replace('</head>', `    <!-- vibedev-seo -->\n    ${tags}\n    <!-- /vibedev-seo -->\n  </head>`)
  }

  return out
}
