export type EventCategory = 'workshop' | 'meetup' | 'conference' | 'hackathon'
export type EventLocationType = 'online' | 'offline' | 'hybrid'
export type EventStatus = 'upcoming' | 'ongoing' | 'past'

export interface AIEvent {
  id: string
  slug: string
  name: string
  date: string
  time: string
  endDate?: string
  endTime?: string
  locationType: EventLocationType
  locationDetail: string
  description: string
  organizer: string
  registrationUrl: string
  coverImage: string
  category: EventCategory
  status: EventStatus
  createdAt?: string
  approved?: boolean
}

export interface EventFormData extends Omit<AIEvent, 'id'> {
  approved: boolean
  submitted_by: string
}
