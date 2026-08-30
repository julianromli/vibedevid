/**
 * Shared JSON-LD schema markup generators for detail routes.
 *
 * Each function returns a plain schema.org object. Routes render the result
 * via a `<script type="application/ld+json">` tag (see `__root.tsx` and
 * `components/sections/home-structured-data.tsx` for the established pattern).
 *
 * Design notes:
 * - Every object carries `"@context": "https://schema.org"` and a `"@type"`.
 * - URLs are always absolute (built with `absoluteUrl`) — Google requires
 *   absolute URLs for `url`, `image`, and `mainEntityOfPage` fields.
 * - Optional fields (image, dates, etc.) are omitted entirely when the
 *   underlying data is missing, rather than emitted as empty strings.
 */

import type { ProfileUser } from '@/app/[username]/profile-data'
import { absoluteUrl } from '@/lib/seo/site-url'
import type { PublishedPostDetail } from '@/lib/server/blog-public'
import type { ProjectDetail } from '@/lib/server/project-public'
import type { EventDto } from '@/types/domain'

const SITE_LOGO = 'https://vibedevid.com/vibedevid_final_black.svg'

/**
 * BlogPosting schema for a blog post detail page.
 * https://schema.org/BlogPosting
 */
export function blogPostingSchema(post: PublishedPostDetail, slug: string) {
  const url = absoluteUrl(`/blog/${slug}`)
  const author = post.author
  const authorName = author?.display_name || 'VibeDev ID'
  const image = post.cover_image || undefined
  const keywords = post.tags.map((t) => t.post_tags?.name).filter((name): name is string => Boolean(name))

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || undefined,
    image: image,
    datePublished: post.published_at || post.created_at || undefined,
    dateModified: post.updated_at || post.published_at || undefined,
    author: {
      '@type': 'Person',
      name: authorName,
      url: author?.username ? absoluteUrl(`/${author.username}`) : undefined,
    },
    publisher: {
      '@type': 'Organization',
      name: 'VibeDev ID',
      logo: {
        '@type': 'ImageObject',
        url: SITE_LOGO,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    ...(keywords.length > 0 ? { keywords: keywords.join(', ') } : {}),
  }
}

/**
 * Event schema for an event detail page.
 * https://schema.org/Event
 */
export function eventSchema(event: EventDto) {
  const url = absoluteUrl(`/event/${event.slug}`)
  const image = event.coverImage || undefined

  // Combine date + time into ISO 8601 start/end strings.
  const startISO = event.date && event.time ? `${event.date}T${event.time}` : event.date || undefined
  const endISO = event.endDate && event.endTime ? `${event.endDate}T${event.endTime}` : event.endDate || undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description,
    startDate: startISO,
    endDate: endISO || undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode:
      event.locationType === 'online'
        ? 'https://schema.org/OnlineEventAttendanceMode'
        : event.locationType === 'offline'
          ? 'https://schema.org/OfflineEventAttendanceMode'
          : 'https://schema.org/MixedEventAttendanceMode',
    image: image,
    location:
      event.locationType === 'online'
        ? {
            '@type': 'VirtualLocation',
            url: event.registrationUrl,
          }
        : {
            '@type': 'Place',
            name: event.locationDetail,
            address: event.locationDetail,
          },
    organizer: {
      '@type': 'Organization',
      name: event.organizer,
      url: event.registrationUrl || undefined,
    },
    url: url,
  }
}

/**
 * ProfilePage schema for a user profile page.
 * https://schema.org/ProfilePage
 */
export function profilePageSchema(user: ProfileUser) {
  const url = absoluteUrl(`/${user.username}`)
  const name = user.display_name || user.username
  const image = user.avatar_url || undefined

  const sameAs: string[] = []
  if (user.github_url) sameAs.push(user.github_url)
  if (user.x_url) sameAs.push(user.x_url)
  if (user.twitter_url) sameAs.push(user.twitter_url)
  if (user.instagram_url) sameAs.push(user.instagram_url)
  if (user.threads_url) sameAs.push(user.threads_url)

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: name,
      alternateName: `@${user.username}`,
      identifier: user.username,
      url: url,
      image: image,
      description: user.bio || undefined,
      ...(user.location ? { address: user.location } : {}),
      ...(user.website ? { 'rdfs:comment': user.website } : {}),
      ...(sameAs.length > 0 ? { sameAs } : {}),
    },
  }
}

/**
 * SoftwareApplication schema for a project detail page.
 * https://schema.org/SoftwareApplication
 */
export function softwareApplicationSchema(project: ProjectDetail) {
  const url = absoluteUrl(`/project/${project.slug}`)
  const image = project.image || project.faviconUrl || undefined
  const description = project.tagline || project.description || undefined
  const author = project.author

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: project.title,
    description: description,
    applicationCategory: project.category || 'DeveloperApplication',
    operatingSystem: 'Web',
    url: url,
    ...(image ? { screenshot: image } : {}),
    ...(project.url ? { downloadUrl: project.url } : {}),
    ...(project.tags.length > 0 ? { keywords: project.tags.join(', ') } : {}),
    author: {
      '@type': 'Person',
      name: author.name,
      url: absoluteUrl(`/${author.username}`),
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'IDR',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating:
      project.likes > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: '5',
            reviewCount: project.likes,
          }
        : undefined,
  }
}

/**
 * BreadcrumbList schema for any detail page.
 * https://schema.org/BreadcrumbList
 *
 * `crumbs` is an array of { name, url } pairs, root-first.
 */
export function breadcrumbListSchema(crumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  }
}
