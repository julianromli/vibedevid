import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import type React from 'react'
import { absoluteUrl } from '@/lib/seo/site-url'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'metadata' })

  const title = t('pages.projects.title')
  const description = t('pages.projects.description')
  const pathname = '/project/list'
  const url = absoluteUrl(pathname)

  return {
    title,
    description,
    alternates: {
      canonical: pathname,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'VibeDev ID',
      images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: t('ogImageAlt') }],
      locale: locale === 'en' ? 'en_US' : 'id_ID',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/opengraph-image.png'],
      site: '@vibedevid',
      creator: '@vibedevid',
    },
  }
}

export default function ProjectListLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
