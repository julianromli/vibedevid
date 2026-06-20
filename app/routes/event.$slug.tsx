import { createServerFn } from '@tanstack/react-start'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { getEventBySlug, getRelatedEvents } from '@/lib/actions/events'
import { absoluteUrl } from '@/lib/seo/site-url'
import { getServerLocale } from '@/lib/routes/helpers'
import { getCurrentUser } from '@/lib/server/auth'
import EventDetailData from '@/app/event/[slug]/event-detail-data'

/**
 * Server-only data fetching for an event detail page. Wrapped in
 * `createServerFn` so the server-only Supabase clients / locale cookie reads
 * never execute (or get bundled) on the client when the loader re-runs during
 * client-side navigation.
 */
const loadEventData = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data: { slug } }) => {
    const { event } = await getEventBySlug(slug)
    if (!event) {
      throw notFound()
    }

    const [{ events, error: relatedError }, currentUser, locale] = await Promise.all([
      getRelatedEvents(event.category, event.id),
      getCurrentUser(),
      getServerLocale(),
    ])

    if (relatedError) {
      console.error('[event.$slug] Failed to fetch related events', {
        eventId: event.id,
        category: event.category,
        error: relatedError,
      })
    }

    return {
      event,
      relatedEvents: relatedError ? [] : (events ?? []),
      currentUser,
      slug,
      locale,
    }
  })

export const Route = createFileRoute('/event/$slug')({
  loader: async ({ params }) => {
    return loadEventData({ data: { slug: params.slug } })
  },
  head: ({ loaderData }) => {
    const event = loaderData?.event
    const locale = loaderData?.locale ?? 'id'

    if (!event) {
      return {
        meta: [{ title: 'Event Not Found | AI Events Indonesia' }],
      }
    }

    const description = event.description.slice(0, 160)
    const pathname = `/event/${event.slug}`
    const url = absoluteUrl(pathname)

    return {
      meta: [
        { title: `${event.name} | AI Events Indonesia` },
        { name: 'description', content: description },
        { property: 'og:title', content: event.name },
        { property: 'og:description', content: description },
        { property: 'og:url', content: url },
        { property: 'og:site_name', content: 'VibeDev ID' },
        { property: 'og:image', content: event.coverImage },
        { property: 'og:locale', content: locale === 'en' ? 'en_US' : 'id_ID' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: event.name },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: event.coverImage },
        { name: 'twitter:site', content: '@vibedevid' },
        { name: 'twitter:creator', content: '@vibedevid' },
      ],
      links: [{ rel: 'canonical', href: pathname }],
    }
  },
  component: EventDetailRoute,
})

function EventDetailRoute() {
  const { event, relatedEvents, currentUser } = Route.useLoaderData()

  return <EventDetailData event={event} relatedEvents={relatedEvents} currentUser={currentUser} />
}
