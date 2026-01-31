'use client'

import { Calendar, Clock, ExternalLink, MapPin, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { AIEvent } from '@/types/events'

interface EventCardProps {
  event: AIEvent
  variant?: 'grid' | 'list'
}

const categoryLabels = {
  workshop: 'Workshop',
  meetup: 'Meetup',
  conference: 'Conference',
  hackathon: 'Hackathon',
}

const statusLabels = {
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  past: 'Past',
}

// Monochrome badge style - white bg, black text
const badgeStyle = 'bg-white text-neutral-900 border-neutral-200/60 backdrop-blur-sm'

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateCompact(dateString: string): { day: string; month: string } {
  const date = new Date(dateString)
  return {
    day: date.getDate().toString().padStart(2, '0'),
    month: date.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase(),
  }
}

function formatTime(timeString: string): string {
  // Extract only time portion if it contains date (e.g., "09:00 - 1 Mar 2025" -> "09:00")
  const timePart = timeString.split(' - ')[0]
  return timePart.trim()
}

export function EventCard({ event, variant = 'grid' }: EventCardProps) {
  const categoryLabel = categoryLabels[event.category]
  const statusLabel = statusLabels[event.status]
  const dateCompact = formatDateCompact(event.date)

  if (variant === 'list') {
    return (
      <Card
        className={cn(
          'group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm',
          'transition-all duration-300 hover:border-border hover:bg-card hover:shadow-lg',
          'dark:hover:shadow-primary/5',
        )}
        data-testid="event-card"
      >
        <div className="flex items-stretch">
          {/* Date Column */}
          <div className="flex w-20 shrink-0 flex-col items-center justify-center border-r border-border/50 bg-muted/30 px-3 py-4">
            <span className="font-bold text-2xl text-foreground leading-none tracking-tight">{dateCompact.day}</span>
            <span className="mt-0.5 font-medium text-muted-foreground text-xs tracking-wider">{dateCompact.month}</span>
          </div>

          {/* Thumbnail */}
          <div className="relative w-32 shrink-0 overflow-hidden sm:w-40">
            <Image
              src={event.coverImage}
              alt={event.name}
              fill
              sizes="160px"
              loading="lazy"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              data-testid="event-cover-image"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.jpg'
              }}
            />
          </div>

          {/* Content */}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-4 py-3 sm:px-5">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-3">
              <h3
                className="line-clamp-1 font-semibold text-foreground text-base leading-snug tracking-tight sm:text-lg"
                data-testid="event-title"
              >
                {event.name}
              </h3>
              <Badge
                className={cn('shrink-0 border px-2.5 py-0.5 text-[10px] font-medium', badgeStyle)}
                data-testid="status-badge"
              >
                {statusLabel}
              </Badge>
            </div>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
              <div
                className="flex items-center gap-1.5"
                data-testid="event-date"
              >
                <Clock className="size-3.5 opacity-60" />
                <span>{formatTime(event.time)}</span>
              </div>
              <div
                className="flex items-center gap-1.5"
                data-testid="event-location"
              >
                <MapPin className="size-3.5 opacity-60" />
                <span className="line-clamp-1">{event.locationDetail}</span>
              </div>
            </div>

            {/* Footer Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge
                  className={cn('border px-2.5 py-0.5 text-[10px] font-medium', badgeStyle)}
                  data-testid="category-badge"
                >
                  {categoryLabel}
                </Badge>
                <span
                  className="text-muted-foreground text-xs"
                  data-testid="event-organizer"
                >
                  by <span className="font-medium text-foreground/80">{event.organizer}</span>
                </span>
              </div>

              {/* CTA */}
              <Link
                href={`/event/${event.slug}`}
                className={cn(
                  'hidden items-center gap-1 rounded-md px-3 py-1.5 font-medium text-xs sm:flex',
                  'bg-primary/10 text-primary transition-colors hover:bg-primary/20',
                  'dark:bg-primary/20 dark:hover:bg-primary/30',
                )}
              >
                Detail Event
                <ExternalLink className="size-3" />
              </Link>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm',
        'transition-all duration-300 hover:border-border hover:bg-card hover:shadow-xl',
        'dark:hover:shadow-primary/5',
      )}
      data-testid="event-card"
    >
      {/* Cover Image with Badges */}
      <div className="relative overflow-hidden">
        <AspectRatio ratio={16 / 9}>
          <Image
            src={event.coverImage}
            alt={event.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            data-testid="event-cover-image"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.jpg'
            }}
          />
        </AspectRatio>

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Category Badge - Top Left */}
        <div className="absolute top-3 left-3">
          <Badge
            className={cn('border px-2.5 py-1 text-xs font-medium', badgeStyle)}
            data-testid="category-badge"
          >
            {categoryLabel}
          </Badge>
        </div>

        {/* Status Badge - Top Right */}
        <div className="absolute top-3 right-3">
          <Badge
            className={cn('border px-2.5 py-1 text-xs font-medium', badgeStyle)}
            data-testid="status-badge"
          >
            {statusLabel}
          </Badge>
        </div>

        {/* Date overlay - Bottom Left */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-black/60 px-2.5 py-1.5 backdrop-blur-sm">
          <Calendar className="size-3.5 text-white/80" />
          <span className="font-medium text-white text-xs">{formatDate(event.date)}</span>
        </div>
      </div>

      {/* Event Details */}
      <div className="space-y-3 p-5">
        {/* Event Title */}
        <h3
          className="line-clamp-2 font-semibold text-foreground text-base leading-snug tracking-tight sm:text-lg"
          data-testid="event-title"
        >
          {event.name}
        </h3>

        {/* Meta info */}
        <div className="flex flex-col gap-2 text-muted-foreground text-sm">
          {/* Time */}
          <div
            className="flex items-center gap-2"
            data-testid="event-date"
          >
            <Clock className="size-4 shrink-0 opacity-60" />
            <span>
              {formatTime(event.time)}
              {event.endTime && ` - ${formatTime(event.endTime)}`}
            </span>
          </div>

          {/* Location */}
          <div
            className="flex items-center gap-2"
            data-testid="event-location"
          >
            <MapPin className="size-4 shrink-0 opacity-60" />
            <span className="line-clamp-1">{event.locationDetail}</span>
          </div>

          {/* Organizer */}
          <div
            className="flex items-center gap-2"
            data-testid="event-organizer"
          >
            <Users className="size-4 shrink-0 opacity-60" />
            <span className="line-clamp-1">{event.organizer}</span>
          </div>
        </div>

        {/* Description */}
        <p
          className="line-clamp-2 text-muted-foreground text-sm leading-relaxed"
          data-testid="event-description"
        >
          {event.description}
        </p>

        {/* CTA */}
        <Link
          href={`/event/${event.slug}`}
          className={cn(
            'mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium text-sm',
            'bg-primary text-primary-foreground transition-all',
            'hover:bg-primary/90 hover:shadow-md',
            'dark:hover:shadow-primary/20',
          )}
        >
          Register Now
          <ExternalLink className="size-4" />
        </Link>
      </div>
    </Card>
  )
}
