import { createFileRoute } from '@tanstack/react-router'
import { getEventBySlug } from '@/lib/actions/events'
import { absoluteUrl } from '@/lib/seo/site-url'
import { getServerLocale } from '@/lib/routes/helpers'
import EventDetailData from '@/app/event/[slug]/event-detail-data'

export const Route = createFileRoute('/event/$slug')({
  loader: async ({ params }) => {
    const { event } = await getEventBySlug(params.slug)
    return { event, slug: params.slug }
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
  const { slug } = Route.useParams()

  return <EventDetailData params={Promise.resolve({ slug })} />
}
