import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import EventDetailData from '@/app/event/[slug]/event-detail-data'
import { getServerLocale } from '@/lib/routes/helpers'
import { publicPageHead } from '@/lib/seo/page-meta'
import { eventSchema } from '@/lib/seo/schema-templates'
import { getCurrentUser } from '@/lib/server/auth'
import { fetchEventBySlug, fetchRelatedEvents } from '@/lib/server/events-public'

const loadEventData = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(1) }))
  .handler(async ({ data: { slug } }) => {
    const event = await fetchEventBySlug(slug)
    if (!event) {
      throw notFound()
    }

    const [relatedEvents, currentUser, locale] = await Promise.all([
      fetchRelatedEvents(event.category, event.id),
      getCurrentUser(),
      getServerLocale(),
    ])

    return {
      event,
      relatedEvents,
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

    return publicPageHead({
      title: `${event.name} | VibeDev ID`,
      description,
      path: `/event/${event.slug}`,
      image: event.coverImage,
      locale: locale === 'en' ? 'en_US' : 'id_ID',
    })
  },
  component: EventDetailRoute,
})

function EventDetailRoute() {
  const { event, relatedEvents, currentUser } = Route.useLoaderData()

  const eventData = eventSchema(event)

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(eventData)}</script>
      <EventDetailData
        event={event}
        relatedEvents={relatedEvents}
        currentUser={currentUser}
      />
    </>
  )
}
