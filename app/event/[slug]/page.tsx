import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getEventBySlug } from '@/lib/actions/events'
import { absoluteUrl } from '@/lib/seo/site-url'
import EventDetailData from './event-detail-data'

interface EventDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const { event } = await getEventBySlug(slug)
  const locale = await getLocale()

  if (!event) {
    return {
      title: 'Event Not Found | AI Events Indonesia',
    }
  }

  const description = event.description.slice(0, 160)
  const pathname = `/event/${event.slug}`
  const url = absoluteUrl(pathname)

  return {
    title: `${event.name} | AI Events Indonesia`,
    description,
    alternates: {
      canonical: pathname,
    },
    openGraph: {
      title: event.name,
      description,
      url,
      siteName: 'VibeDev ID',
      images: [{ url: event.coverImage, width: 1200, height: 630, alt: event.name }],
      locale: locale === 'en' ? 'en_US' : 'id_ID',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.name,
      description,
      images: [event.coverImage],
      site: '@vibedevid',
      creator: '@vibedevid',
    },
  }
}

function EventDetailLoadingFallback() {
  return (
    <div className="bg-grid-pattern relative min-h-screen">
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>

      <nav className="h-16 w-full border-b bg-background/80 backdrop-blur-md" />

      <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Skeleton className="h-9 w-32" />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <div className="bg-muted relative overflow-hidden rounded-xl">
              <Skeleton className="aspect-video w-full rounded-lg" />
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>

              <Skeleton className="h-10 w-3/4" />

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <Skeleton className="h-5 w-64" />
                </div>
                <div className="flex items-start gap-3">
                  <Skeleton className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <Skeleton className="h-5 w-80" />
                </div>
                <div className="flex items-start gap-3">
                  <Skeleton className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <Skeleton className="h-5 w-48" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border p-6">
              <Skeleton className="h-11 w-full" />
            </div>
            <div className="rounded-lg border p-6">
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        <div className="mt-16">
          <Skeleton className="mb-6 h-8 w-48" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg border p-0"
              >
                <Skeleton className="aspect-video w-full rounded-t-lg" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t bg-background py-12">
        <div className="mx-auto max-w-7xl px-4">
          <Skeleton className="mx-auto h-5 w-64" />
          <Skeleton className="mx-auto mt-2 h-4 w-48" />
        </div>
      </footer>
    </div>
  )
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  return (
    <Suspense fallback={<EventDetailLoadingFallback />}>
      <EventDetailData params={params} />
    </Suspense>
  )
}
