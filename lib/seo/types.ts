export type OgType = 'website' | 'article'

export interface PageMeta {
  title: string
  description: string
  canonical: string
  ogType?: OgType
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogImageAlt?: string
  ogUrl?: string
  locale?: string
  publishedTime?: string
  authors?: string[]
  keywords?: string[]
  robots?: string
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}
