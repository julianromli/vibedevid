import { ArrowLeft, Calendar, ExternalLink, MapPin, Users } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { EventCard } from '@/components/event/event-card'
import { EventShareButton } from '@/components/event/event-share-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import { getEventBySlug, getRelatedEvents } from '@/lib/actions/events'
import { formatEventDateRange } from '@/lib/events-utils'
import { absoluteUrl } from '@/lib/seo/site-url'
import { getCurrentUser } from '@/lib/server/auth'

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

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params
  const { event } = await getEventBySlug(slug)

  if (!event) {
    notFound()
  }

  const { events: relatedEvents, error: relatedError } = await getRelatedEvents(event.category, event.id)
  if (relatedError) {
  }
  const currentUser = await getCurrentUser()

  const isPastEvent = event.status === 'past'
  const formattedDate = formatEventDateRange(event.date, event.time, event.endDate, event.endTime)

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        showBackButton={true}
        showNavigation={true}
        isLoggedIn={!!currentUser}
        user={currentUser || undefined}
      />

      <main className="container mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link
            href="/event/list"
            className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Content Area */}
          <div className="space-y-8 lg:col-span-8">
            {/* Header Section */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="capitalize"
                >
                  {event.category}
                </Badge>
                <Badge
                  variant={
                    event.status === 'upcoming' ? 'default' : event.status === 'ongoing' ? 'secondary' : 'outline'
                  }
                  className="capitalize"
                >
                  {event.status}
                </Badge>
              </div>
              <h1 className="font-bold text-4xl tracking-tight lg:text-5xl">{event.name}</h1>
            </div>

            {/* Cover Image */}
            <div className="relative overflow-hidden rounded-xl border bg-muted shadow-sm">
              <Image
                src={event.coverImage}
                alt={event.name}
                width={1200}
                height={675}
                priority
                className="h-auto w-full object-contain transition-transform duration-700 hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
              />
              <div className="absolute inset-0" />
            </div>

            {/* Bento Info Grid */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-none bg-muted/30 shadow-none transition-colors hover:bg-muted/50">
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="w-fit rounded-lg bg-primary/10 p-2 text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Date & Time</p>
                    <p className="mt-1 font-semibold text-sm">{formattedDate}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none bg-muted/30 shadow-none transition-colors hover:bg-muted/50">
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="w-fit rounded-lg bg-primary/10 p-2 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Location</p>
                    <p className="mt-1 font-semibold text-sm capitalize">{event.locationType}</p>
                    <p className="text-muted-foreground text-xs">{event.locationDetail}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none bg-muted/30 shadow-none transition-colors hover:bg-muted/50">
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="w-fit rounded-lg bg-primary/10 p-2 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">Organizer</p>
                    <p className="mt-1 font-semibold text-sm">{event.organizer}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <h2 className="mb-4 font-bold">About this Event</h2>
              <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{event.description}</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="relative lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* Actions Card */}
              <Card className="relative overflow-hidden border-primary/20 shadow-lg">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-purple-600" />
                <CardContent className="space-y-6 p-6">
                  {!isPastEvent ? (
                    <>
                      <div className="space-y-2">
                        <h3 className="font-bold text-xl">Ready to join?</h3>
                        <p className="text-muted-foreground text-sm">
                          Secure your spot for this event. Registration is open until seats are filled.
                        </p>
                      </div>
                      <Button
                        asChild
                        size="lg"
                        className="w-full font-semibold shadow-md"
                      >
                        <a
                          href={event.registrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          Register Now
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <h3 className="font-bold text-muted-foreground text-xl">Event Ended</h3>
                      <p className="text-muted-foreground text-sm">
                        This event has ended. Check out related events below.
                      </p>
                    </div>
                  )}

                  {!isPastEvent && (
                    <EventShareButton
                      eventTitle={event.name}
                      eventSlug={event.slug}
                    />
                  )}
                  {isPastEvent && (
                    <EventShareButton
                      eventTitle={event.name}
                      eventSlug={event.slug}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <div className="mt-20 border-t pt-10">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-bold text-2xl tracking-tight">Related Events</h2>
              <Link href="/event/list">
                <Button
                  variant="ghost"
                  className="gap-1"
                >
                  View all <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedEvents.map((relatedEvent) => (
                <EventCard
                  key={relatedEvent.id}
                  event={relatedEvent}
                  variant="grid"
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
