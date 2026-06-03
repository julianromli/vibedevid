import { getProjectBySlug } from '@/lib/actions'
import { getEventBySlug } from '@/lib/actions/events'
import { BLOG_DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_PATH, RESERVED_PROFILE_SEGMENTS, SITE_NAME } from '@/lib/seo/constants'
import { formatTitle, getMetadataMessages, type SeoLocale } from '@/lib/seo/messages'
import { absoluteUrl, getSiteUrl } from '@/lib/seo/site-url'
import type { PageMeta } from '@/lib/seo/types'
import { createClient } from '@/lib/supabase/server'

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}…`
}

function homeMeta(locale: SeoLocale): PageMeta {
  const m = getMetadataMessages(locale)
  const siteUrl = getSiteUrl()
  const ogLocale = locale === 'en' ? 'en_US' : 'id_ID'

  return {
    title: m.title,
    description: m.description,
    canonical: siteUrl,
    ogTitle: m.ogTitle,
    ogDescription: m.ogDescription,
    ogImage: DEFAULT_OG_IMAGE_PATH,
    ogImageAlt: m.ogImageAlt,
    ogUrl: siteUrl,
    locale: ogLocale,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: siteUrl,
        logo: absoluteUrl('/vibedevid_final_black.svg'),
        sameAs: ['https://x.com/vibedevid'],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: siteUrl,
      },
    ],
  }
}

function staticPageMeta(locale: SeoLocale, pathname: string, title: string, description: string): PageMeta {
  const m = getMetadataMessages(locale)
  return {
    title: formatTitle(m.titleTemplate, title),
    description,
    canonical: absoluteUrl(pathname),
    ogImage: DEFAULT_OG_IMAGE_PATH,
    locale: locale === 'en' ? 'en_US' : 'id_ID',
  }
}

async function projectMeta(slug: string, locale: SeoLocale): Promise<PageMeta> {
  const m = getMetadataMessages(locale)
  const { project, error } = await getProjectBySlug(slug)

  if (error || !project) {
    return staticPageMeta(
      locale,
      `/project/${slug}`,
      'Project Not Found',
      'This project could not be found on VibeDev ID.',
    )
  }

  const description = truncate(project.tagline || project.description || project.title, 160)
  const pathname = `/project/${project.slug}`
  const images = project.imageUrls?.length ? project.imageUrls : project.image ? [project.image] : []
  const ogImage = images[0] || project.faviconUrl || DEFAULT_OG_IMAGE_PATH

  return {
    title: formatTitle(m.titleTemplate, project.title),
    description,
    canonical: absoluteUrl(pathname),
    ogTitle: project.title,
    ogDescription: description,
    ogImage,
    ogImageAlt: project.title,
    ogUrl: absoluteUrl(pathname),
    locale: locale === 'en' ? 'en_US' : 'id_ID',
    ogType: 'website',
  }
}

async function blogPostMeta(slug: string, locale: SeoLocale): Promise<PageMeta> {
  const m = getMetadataMessages(locale)
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('posts')
    .select(`
      title,
      excerpt,
      cover_image,
      published_at,
      author:users!posts_author_id_fkey(display_name),
      tags:blog_post_tags(post_tags(name))
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) {
    return staticPageMeta(
      locale,
      `/blog/${slug}`,
      'Post Not Found',
      'The blog post you are looking for does not exist.',
    )
  }

  const author = post.author as unknown as { display_name: string } | null
  const authorName = author?.display_name || SITE_NAME
  const tags = post.tags as unknown as Array<{ post_tags: { name: string } | null }> | null
  const postTags = tags?.map((t) => t.post_tags?.name).filter((name): name is string => Boolean(name)) ?? []
  const description = post.excerpt || `Baca artikel ${post.title} di VibeDev ID Blog`
  const pathname = `/blog/${slug}`

  return {
    title: formatTitle(m.titleTemplate, post.title),
    description,
    canonical: absoluteUrl(pathname),
    ogTitle: post.title,
    ogDescription: description,
    ogImage: post.cover_image || BLOG_DEFAULT_OG_IMAGE,
    ogImageAlt: post.title,
    ogUrl: absoluteUrl(pathname),
    locale: locale === 'en' ? 'en_US' : 'id_ID',
    ogType: 'article',
    publishedTime: post.published_at || undefined,
    authors: [authorName],
    keywords: postTags.length > 0 ? postTags : undefined,
  }
}

async function eventMeta(slug: string, locale: SeoLocale): Promise<PageMeta> {
  const { event } = await getEventBySlug(slug)

  if (!event) {
    return staticPageMeta(locale, `/event/${slug}`, 'Event Not Found', 'The event you are looking for does not exist.')
  }

  const description = truncate(event.description, 160)
  const pathname = `/event/${event.slug}`

  return {
    title: `${event.name} | AI Events Indonesia`,
    description,
    canonical: absoluteUrl(pathname),
    ogTitle: event.name,
    ogDescription: description,
    ogImage: event.coverImage,
    ogImageAlt: event.name,
    ogUrl: absoluteUrl(pathname),
    locale: locale === 'en' ? 'en_US' : 'id_ID',
    ogType: 'website',
  }
}

async function profileMeta(username: string, locale: SeoLocale): Promise<PageMeta> {
  const m = getMetadataMessages(locale)
  const supabase = await createClient()
  const { data: user } = await supabase
    .from('users')
    .select('username, display_name, bio, avatar_url')
    .eq('username', username)
    .single()

  if (!user) {
    return staticPageMeta(locale, `/${username}`, `@${username}`, 'User profile not found on VibeDev ID.')
  }

  const displayName = user.display_name || user.username
  const description = user.bio ? truncate(user.bio, 160) : `Profil ${displayName} di komunitas VibeDev ID.`
  const pathname = `/${username}`

  return {
    title: formatTitle(m.titleTemplate, `${displayName} (@${user.username})`),
    description,
    canonical: absoluteUrl(pathname),
    ogTitle: `${displayName} (@${user.username})`,
    ogDescription: description,
    ogImage: user.avatar_url || DEFAULT_OG_IMAGE_PATH,
    ogImageAlt: displayName,
    ogUrl: absoluteUrl(pathname),
    locale: locale === 'en' ? 'en_US' : 'id_ID',
  }
}

export function resolveLocaleFromPath(pathname: string, cookieLocale?: string | null): SeoLocale {
  if (pathname === '/en' || pathname.startsWith('/en/')) return 'en'
  if (cookieLocale === 'en' || cookieLocale === 'id') return cookieLocale
  return 'id'
}

export async function resolvePageMeta(pathname: string, locale: SeoLocale): Promise<PageMeta> {
  const path = pathname.split('?')[0].replace(/\/$/, '') || '/'
  const m = getMetadataMessages(locale)

  if (path === '/' || path === '/en') {
    return homeMeta(locale)
  }

  if (path === '/project/list') {
    return staticPageMeta(locale, path, m.pages.projects.title, m.pages.projects.description)
  }

  if (path === '/blog') {
    return staticPageMeta(locale, path, m.pages.blog.title, m.pages.blog.description)
  }

  if (path === '/event/list') {
    return staticPageMeta(locale, path, m.pages.events.title, m.pages.events.description)
  }

  if (path === '/privacy-policy') {
    return staticPageMeta(locale, path, 'Privacy Policy', 'Privacy policy for VibeDev ID.')
  }

  if (path === '/terms-of-service') {
    return staticPageMeta(locale, path, 'Terms of Service', 'Terms of service for VibeDev ID.')
  }

  if (path === '/terms') {
    return staticPageMeta(locale, '/terms-of-service', 'Terms of Service', 'Terms of service for VibeDev ID.')
  }

  if (
    path === '/user/auth' ||
    path === '/project/submit' ||
    path === '/dashboard' ||
    path.startsWith('/dashboard/') ||
    path === '/admin' ||
    path.startsWith('/admin/') ||
    path === '/blog/editor' ||
    path.startsWith('/blog/editor/')
  ) {
    return {
      ...staticPageMeta(locale, path, 'Private Area', 'This page is not intended for search indexing.'),
      robots: 'noindex, nofollow',
    }
  }

  const projectMatch = path.match(/^\/project\/([^/]+)$/)
  if (projectMatch) {
    return projectMeta(projectMatch[1], locale)
  }

  const blogMatch = path.match(/^\/blog\/([^/]+)$/)
  if (blogMatch && blogMatch[1] !== 'editor') {
    return blogPostMeta(blogMatch[1], locale)
  }

  const eventMatch = path.match(/^\/event\/([^/]+)$/)
  if (eventMatch && eventMatch[1] !== 'list') {
    return eventMeta(eventMatch[1], locale)
  }

  const profileMatch = path.match(/^\/([^/]+)$/)
  if (profileMatch && !RESERVED_PROFILE_SEGMENTS.has(profileMatch[1])) {
    return profileMeta(profileMatch[1], locale)
  }

  return homeMeta(locale)
}
