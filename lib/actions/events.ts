'use server'

import { revalidatePath } from 'next/cache'
import { validateEventForm } from '@/lib/event-form-utils'
import { createClient } from '@/lib/supabase/server'
import type { AIEvent, EventCategory, EventFormData, EventLocationType } from '@/types/events'

// Helper to map DB result (snake_case) to AIEvent (camelCase)
function mapEventFromDB(data: any): AIEvent {
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    date: data.date,
    time: data.time,
    endDate: data.end_date,
    endTime: data.end_time,
    locationType: data.location_type as EventLocationType,
    locationDetail: data.location_detail,
    description: data.description,
    organizer: data.organizer,
    registrationUrl: data.registration_url,
    coverImage: data.cover_image,
    category: data.category as EventCategory,
    status: data.status,
  }
}

interface GetEventsFilters {
  category?: string
  locationType?: string
  sort?: 'nearest' | 'latest'
}

export async function getEvents(filters: GetEventsFilters = {}) {
  const supabase = await createClient()

  let query = supabase.from('events').select('*').eq('approved', true)

  // Apply filters
  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }

  if (filters.locationType && filters.locationType !== 'all') {
    query = query.eq('location_type', filters.locationType)
  }

  // Apply sorting
  if (filters.sort === 'latest') {
    query = query.order('created_at', { ascending: false })
  } else {
    // Default to 'nearest' (upcoming events sorted by date)
    // We might want to filter out past events here too, but for now just sort
    query = query.order('date', { ascending: true })
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching events:', error)
    return { events: [], error: 'Failed to fetch events' }
  }

  const events = data?.map(mapEventFromDB) || []
  return { events }
}

export async function getEventBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from('events').select('*').eq('slug', slug).single()

  if (error) {
    console.error('Error fetching event by slug:', error)
    return { event: null, error: 'Failed to fetch event' }
  }

  return { event: mapEventFromDB(data) }
}

export async function submitEvent(formData: EventFormData) {
  try {
    // Validate form data server-side
    const validation = validateEventForm(formData)
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ')
      return { success: false, error: `Validation failed: ${errorMessages}` }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'You must be logged in to submit an event' }
    }

    // Map camelCase to snake_case for DB insertion
    const dbData = {
      slug: formData.slug,
      name: formData.name,
      date: formData.date,
      time: formData.time,
      // end_date and end_time are omitted from EventFormData
      location_type: formData.locationType,
      location_detail: formData.locationDetail,
      description: formData.description,
      organizer: formData.organizer,
      registration_url: formData.registrationUrl,
      cover_image: formData.coverImage,
      category: formData.category,
      status: 'upcoming', // Default status
      approved: false, // Default approved status
      submitted_by: user.id, // Use authenticated user ID
    }

    const { error } = await supabase.from('events').insert(dbData)

    if (error) {
      console.error('Error submitting event:', error)
      return { success: false, error: 'Failed to submit event' }
    }

    revalidatePath('/event/list')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error submitting event:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
