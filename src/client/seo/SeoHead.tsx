'use client'

import { useQuery } from '@tanstack/react-query'
import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import { SITE_NAME, TWITTER_SITE } from '@/lib/seo/constants'
import { absoluteUrl } from '@/lib/seo/site-url'
import type { PageMeta } from '@/lib/seo/types'

function toAbsoluteImage(url: string | undefined): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return absoluteUrl(url.startsWith('/') ? url : `/${url}`)
}

function MetaTags({ meta }: { meta: PageMeta }) {
  const ogImage = toAbsoluteImage(meta.ogImage) ?? absoluteUrl('/opengraph-image.png')

  return (
    <Helmet>
      <html lang={meta.locale?.startsWith('en') ? 'en' : 'id'} />
      <title>{meta.title}</title>
      <meta
        name="description"
        content={meta.description}
      />
      {meta.robots ? (
        <meta
          name="robots"
          content={meta.robots}
        />
      ) : null}
      <link
        rel="canonical"
        href={meta.canonical}
      />
      {meta.keywords?.map((keyword) => (
        <meta
          key={keyword}
          name="keywords"
          content={keyword}
        />
      ))}
      <meta
        property="og:title"
        content={meta.ogTitle ?? meta.title}
      />
      <meta
        property="og:description"
        content={meta.ogDescription ?? meta.description}
      />
      <meta
        property="og:url"
        content={meta.ogUrl ?? meta.canonical}
      />
      <meta
        property="og:site_name"
        content={SITE_NAME}
      />
      <meta
        property="og:locale"
        content={meta.locale ?? 'id_ID'}
      />
      <meta
        property="og:type"
        content={meta.ogType ?? 'website'}
      />
      <meta
        property="og:image"
        content={ogImage}
      />
      <meta
        property="og:image:alt"
        content={meta.ogImageAlt ?? meta.title}
      />
      <meta
        name="twitter:card"
        content="summary_large_image"
      />
      <meta
        name="twitter:site"
        content={TWITTER_SITE}
      />
      <meta
        name="twitter:creator"
        content={TWITTER_SITE}
      />
      <meta
        name="twitter:title"
        content={meta.ogTitle ?? meta.title}
      />
      <meta
        name="twitter:description"
        content={meta.ogDescription ?? meta.description}
      />
      <meta
        name="twitter:image"
        content={ogImage}
      />
      {meta.publishedTime ? (
        <meta
          property="article:published_time"
          content={meta.publishedTime}
        />
      ) : null}
      {meta.authors?.map((author) => (
        <meta
          key={author}
          property="article:author"
          content={author}
        />
      ))}
    </Helmet>
  )
}

export function SeoHead() {
  const { pathname, search } = useLocation()
  const path = `${pathname}${search}`

  const { data: meta } = useQuery({
    queryKey: ['seo-meta', path],
    queryFn: async () => {
      const res = await fetch(`/api/seo/meta?path=${encodeURIComponent(pathname)}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to load SEO meta')
      return res.json() as Promise<PageMeta>
    },
    staleTime: 60_000,
  })

  if (!meta) return null

  return <MetaTags meta={meta} />
}
