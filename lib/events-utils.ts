import type { AIEvent, EventCategory, EventLocationType } from '@/types/events'
import { mockEvents } from '@/lib/data/mock-events'

/**
 * Get event by slug from mock data
 */
export function getEventBySlug(slug: string): AIEvent | undefined {
  return mockEvents.find((event) => event.slug === slug)
}

/**
 * Get related events by category, excluding current event
 */
export function getRelatedEvents(category: EventCategory, excludeId: string, limit: number = 3): AIEvent[] {
  return mockEvents.filter((event) => event.category === category && event.id !== excludeId).slice(0, limit)
}

/**
 * Format event date for display (e.g., "15 Feb 2025")
 */
export function formatEventDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Format event time for display (e.g., "09:00")
 */
export function formatEventTime(timeString: string): string {
  return timeString
}

/**
 * Format event date range for multi-day events
 */
export function formatEventDateRange(
  startDate: string,
  startTime: string,
  endDate?: string,
  endTime?: string
): string {
  const formattedStartDate = formatEventDate(startDate)
  const formattedStartTime = formatEventTime(startTime)

  if (!endDate) {
    return `${formattedStartDate}, ${formattedStartTime}`
  }

  const formattedEndDate = formatEventDate(endDate)
  const formattedEndTime = endTime ? formatEventTime(endTime) : ''

  if (startDate === endDate) {
    // Same day event with end time
    return `${formattedStartDate}, ${formattedStartTime} - ${formattedEndTime}`
  }

  // Multi-day event
  return `${formattedStartDate}, ${formattedStartTime} - ${formattedEndDate}, ${formattedEndTime}`
}

/**
 * Filter events by category
 */
export function filterByCategory(events: AIEvent[], category: EventCategory | 'All'): AIEvent[] {
  if (category === 'All') return events
  return events.filter((event) => event.category === category)
}

/**
 * Filter events by location type
 */
export function filterByLocation(events: AIEvent[], locationType: EventLocationType | 'All'): AIEvent[] {
  if (locationType === 'All') return events
  return events.filter((event) => event.locationType === locationType)
}

/**
 * Filter events by date range (inclusive)
 */
export function filterByDateRange(events: AIEvent[], startDate?: string, endDate?: string): AIEvent[] {
  if (!startDate && !endDate) return events

  return events.filter((event) => {
    const eventDate = new Date(event.date)

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      return eventDate >= start && eventDate <= end
    }

    if (startDate) {
      const start = new Date(startDate)
      return eventDate >= start
    }

    if (endDate) {
      const end = new Date(endDate)
      return eventDate <= end
    }

    return true
  })
}

/**
 * Sort events by nearest date (upcoming events first, then past events)
 */
export function sortByNearestDate(events: AIEvent[]): AIEvent[] {
  const now = new Date()

  return [...events].sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)

    // Prioritize upcoming/ongoing over past
    const isAPast = a.status === 'past'
    const isBPast = b.status === 'past'

    if (isAPast !== isBPast) {
      return isAPast ? 1 : -1
    }

    // For events with same status category, sort by nearest date
    const diffA = Math.abs(dateA.getTime() - now.getTime())
    const diffB = Math.abs(dateB.getTime() - now.getTime())

    return diffA - diffB
  })
}

/**
 * Apply multiple filters to events
 */
export interface EventFilters {
  category?: EventCategory | 'All'
  locationType?: EventLocationType | 'All'
  startDate?: string
  endDate?: string
}

export function applyFilters(events: AIEvent[], filters: EventFilters): AIEvent[] {
  let filtered = events

  if (filters.category) {
    filtered = filterByCategory(filtered, filters.category)
  }

  if (filters.locationType) {
    filtered = filterByLocation(filtered, filters.locationType)
  }

  if (filters.startDate || filters.endDate) {
    filtered = filterByDateRange(filtered, filters.startDate, filters.endDate)
  }

  return sortByNearestDate(filtered)
}
