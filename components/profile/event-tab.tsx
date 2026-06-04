import { Calendar, Clock, MapPin, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { AIEvent } from '@/types/events'

interface EventTabProps {
  events: AIEvent[]
}

const statusColors: Record<string, string> = {
  upcoming: 'bg-blue-500/10 text-blue-600 border-blue-200',
  ongoing: 'bg-green-500/10 text-green-600 border-green-200',
  past: 'bg-gray-500/10 text-gray-600 border-gray-200',
}

const approvalColors: Record<string, string> = {
  true: 'bg-green-500/10 text-green-600 border-green-200',
  false: 'bg-amber-500/10 text-amber-600 border-amber-200',
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function EventTab({ events }: EventTabProps) {
  return (
    <div className="grid gap-4">
      {events.map((event) => (
        <Card
          key={event.id}
          className={cn(
            'group overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm',
            'transition-all duration-300 hover:border-border hover:bg-card hover:shadow-lg',
          )}
        >
          <div className="flex flex-col sm:flex-row">
            {/* Cover Image */}
            <div className="relative h-40 w-full shrink-0 overflow-hidden sm:h-auto sm:w-48">
              <Image
                src={event.coverImage}
                alt={event.name}
                fill
                sizes="192px"
                loading="lazy"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.jpg'
                }}
              />
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col justify-between p-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn('text-xs', statusColors[event.status] || statusColors.upcoming)}
                  >
                    {event.status}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn('text-xs', approvalColors[String(event.approved)] || approvalColors.false)}
                  >
                    {event.approved ? 'Disetujui' : 'Menunggu Review'}
                  </Badge>
                </div>

                <h3 className="font-semibold text-foreground text-base leading-snug tracking-tight">
                  <Link
                    href={`/event/${event.slug}`}
                    className="hover:text-primary transition-colors"
                  >
                    {event.name}
                  </Link>
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 opacity-60" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5 opacity-60" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 opacity-60" />
                    <span className="line-clamp-1">{event.locationDetail}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="size-3.5 opacity-60" />
                    <span>{event.organizer}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
