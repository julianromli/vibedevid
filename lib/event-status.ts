import type { EventStatus } from '@/types/events'

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export function parseDateOnlyAsLocalDate(date: string): Date {
  const match = DATE_ONLY_PATTERN.exec(date)

  if (!match) {
    throw new Error('Event date must use YYYY-MM-DD format')
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const localDate = new Date(year, month - 1, day)
  localDate.setHours(0, 0, 0, 0)

  if (localDate.getFullYear() !== year || localDate.getMonth() !== month - 1 || localDate.getDate() !== day) {
    throw new Error('Event date must be a valid calendar date')
  }

  return localDate
}

export function computeEventStatus(date: string, today: Date = new Date()): EventStatus {
  if (!(today instanceof Date) || Number.isNaN(today.getTime())) {
    throw new Error('Today must be a valid Date')
  }

  const eventDate = parseDateOnlyAsLocalDate(date)
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  if (eventDate < currentDate) return 'past'
  if (eventDate.getTime() === currentDate.getTime()) return 'ongoing'
  return 'upcoming'
}
