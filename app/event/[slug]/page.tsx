import { ArrowLeft, Calendar, Clock, ExternalLink, MapPin, Users } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EventCard } from '@/components/event/event-card'
import { EventShareButton } from '@/components/event/event-share-button'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import { getEventBySlug, getRelatedEvents } from '@/lib/actions/events'
import { formatEventDateRange } from '@/lib/events-utils'
import { getCurrentUser } from '@/lib/server/auth'

interface EventDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const { event } = await getEventBySlug(slug)

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
  const { event } = await getEventBySlug(slug)

  if (!event) {
    notFound()
  }

  const { events: relatedEvents, error: relatedError } = await getRelatedEvents(event.category, event.id)
  if (relatedError) {
    console.error('Error fetching related events:', relatedError)
  }
  const currentUser = await getCurrentUser()

  const isPastEvent = event.status === 'past'
  const formattedDate = formatEventDateRange(event.date, event.time, event.endDate, event.endTime)

  return (
    <div className="bg-background min-h-screen">
      <Navbar
        showNavigation={true}
        isLoggedIn={!!currentUser}
        user={currentUser || undefined}
      />

      <main className="container mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link
            href="/event/list"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
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
              <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">{event.name}</h1>
            </div>

            {/* Cover Image */}
            <div className="overflow-hidden rounded-xl border bg-muted shadow-sm">
              <AspectRatio ratio={16 / 9}>
                <Image
                  src={event.coverImage}
                  alt={event.name}
                  fill
                  priority
                  className="object-cover transition-transform hover:scale-105 duration-700"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
              </AspectRatio>
            </div>

            {/* Bento Info Grid */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="bg-muted/30 border-none shadow-none hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="p-2 bg-primary/10 w-fit rounded-lg text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Date & Time</p>
                    <p className="font-semibold mt-1 text-sm">{formattedDate}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30 border-none shadow-none hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="p-2 bg-primary/10 w-fit rounded-lg text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Location</p>
                    <p className="font-semibold mt-1 text-sm capitalize">{event.locationType}</p>
                    <p className="text-xs text-muted-foreground">{event.locationDetail}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30 border-none shadow-none hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="p-2 bg-primary/10 w-fit rounded-lg text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Organizer</p>
                    <p className="font-semibold mt-1 text-sm">{event.organizer}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <h3 className="text-xl font-bold mb-4">About this Event</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-24 space-y-6">
              {/* Actions Card */}
              <Card className="border-primary/20 shadow-lg overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-600" />
                <CardContent className="p-6 space-y-6">
                  {!isPastEvent ? (
                    <>
                      <div className="space-y-2">
                        <h3 className="font-bold text-xl">Ready to join?</h3>
                        <p className="text-sm text-muted-foreground">
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
                      <h3 className="font-bold text-xl text-muted-foreground">Event Ended</h3>
                      <p className="text-sm text-muted-foreground">
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
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Related Events</h2>
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
