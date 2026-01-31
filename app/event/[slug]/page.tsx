import { ArrowLeft, Calendar, ExternalLink, MapPin, Users } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EventShareButton } from '@/components/event/event-share-button'
import { EventCard } from '@/components/event/event-card'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import { formatEventDateRange, getEventBySlug, getRelatedEvents } from '@/lib/events-utils'
import { getCurrentUser } from '@/lib/server/auth'

interface EventDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const event = getEventBySlug(slug)

  if (!event) {
    return {
      title: 'Event Not Found | AI Events Indonesia',
    }
  }

  const description = event.description.slice(0, 160)

  return {
    title: `${event.name} | AI Events Indonesia`,
    description,
    openGraph: {
      title: event.name,
      description,
      images: [event.coverImage],
      type: 'website',
    },
  }
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params
  const event = getEventBySlug(slug)

  if (!event) {
    notFound()
  }

  const relatedEvents = getRelatedEvents(event.category, event.id)
  const currentUser = await getCurrentUser()

  const isPastEvent = event.status === 'past'
  const formattedDate = formatEventDateRange(event.date, event.time, event.endDate, event.endTime)

  return (
    <div className="bg-grid-pattern relative min-h-screen">
      {/* Background Gradient Overlay */}
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>

      <Navbar
        showNavigation={true}
        isLoggedIn={!!currentUser}
        user={currentUser || undefined}
      />

      {/* Content Container */}
      <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/event/list">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Events
            </Button>
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Cover Image */}
            <div className="bg-muted relative overflow-hidden rounded-xl">
              <AspectRatio ratio={16 / 9}>
                <Image
                  src={event.coverImage}
                  alt={event.name}
                  fill
                  priority
                  className="h-full w-full object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                />
                {/* Gradient Overlay */}
                <div className="from-background/20 to-background/60 absolute inset-0 bg-gradient-to-t"></div>
              </AspectRatio>
            </div>

            {/* Event Header */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium capitalize">
                  {event.category}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
                    event.status === 'upcoming'
                      ? 'bg-blue-500/10 text-blue-500'
                      : event.status === 'ongoing'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-gray-500/10 text-gray-500'
                  }`}
                >
                  {event.status}
                </span>
              </div>

              <h1 className="text-foreground text-3xl leading-tight font-bold lg:text-4xl">{event.name}</h1>

              {/* Event Info */}
              <div className="space-y-3">
                <div className="text-muted-foreground flex items-start gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>{formattedDate}</span>
                </div>

                <div className="text-muted-foreground flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <span className="font-medium capitalize">{event.locationType}</span>
                    <span className="mx-2">•</span>
                    <span>{event.locationDetail}</span>
                  </div>
                </div>

                <div className="text-muted-foreground flex items-start gap-3">
                  <Users className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>{event.organizer}</span>
                </div>
              </div>

              {/* Description */}
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-muted-foreground text-base leading-relaxed">{event.description}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration CTA */}
            {!isPastEvent && (
              <Card>
                <CardContent className="p-6">
                  <Button
                    asChild
                    size="lg"
                    className="w-full"
                  >
                    <a
                      href={event.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Register Now
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Share Button */}
            <Card>
              <CardContent className="p-6">
                <EventShareButton
                  eventTitle={event.name}
                  eventSlug={event.slug}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <div className="mt-16">
            <h2 className="text-foreground mb-6 text-2xl font-bold">Related Events</h2>
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
      </div>

      <Footer />
    </div>
  )
}
