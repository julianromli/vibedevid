import { createFileRoute, notFound } from '@tanstack/react-router'
import { getEventBySlug, getRelatedEvents } from '@/lib/actions/events'
import { absoluteUrl } from '@/lib/seo/site-url'
import { getServerLocale } from '@/lib/routes/helpers'
import { getCurrentUser } from '@/lib/server/auth'
import EventDetailData from '@/app/event/[slug]/event-detail-data'

export const Route = createFileRoute('/event/$slug')({
  loader: async ({ params }) => {
    const { event } = await getEventBySlug(params.slug)
    if (!event) {
      throw notFound()
    }

    const [{ events, error: relatedError }, currentUser] = await Promise.all([
      getRelatedEvents(event.category, event.id),
      getCurrentUser(),
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
      slug: params.slug,
    }
  },
  head: ({ loaderData }) => {
    const event = loaderData?.event
    const locale = getServerLocale()

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
