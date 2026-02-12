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

const ROLES = {
  ADMIN: 0,
} as const

async function checkAdminAccess() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, userId: null, error: 'Unauthorized' as const }
  }

  const { data: userData, error } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (error || !userData || userData.role !== ROLES.ADMIN) {
    return { supabase, userId: user.id, error: 'Unauthorized' as const }
  }

  return { supabase, userId: user.id, error: null }
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
  // Validate slug parameter
  if (!slug || typeof slug !== 'string') {
    return { event: null, error: 'Invalid slug parameter' }
  }

  const sanitizedSlug = slug.trim().toLowerCase()
  if (sanitizedSlug.length === 0 || sanitizedSlug.length > 200) {
    return { event: null, error: 'Invalid slug format' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.from('events').select('*').eq('slug', sanitizedSlug).single()

  if (error) {
    console.error('Error fetching event by slug:', error)
    return { event: null, error: 'Failed to fetch event' }
  }

  return { event: mapEventFromDB(data) }
}

export async function getRelatedEvents(category: string, excludeId: string, limit: number = 3) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('category', category)
    .neq('id', excludeId)
    .eq('approved', true)
    .limit(limit)

  if (error) {
    console.error('Error fetching related events:', error)
    return { events: [], error: 'Failed to fetch related events' }
  }

  return { events: data?.map(mapEventFromDB) || [] }
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

// Helper to validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Admin: Get pending events awaiting approval
export async function getPendingEvents() {
  try {
    const { supabase, error: adminError } = await checkAdminAccess()
    if (adminError) {
      return { events: [], error: 'Unauthorized' }
    }

    const { data, error } = await supabase.from('events').select('*').eq('approved', false).order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending events:', error)
      return { events: [], error: 'Failed to fetch pending events' }
    }

    return { events: data?.map(mapEventFromDB) || [] }
  } catch (error) {
    console.error('Unexpected error fetching pending events:', error)
    return { events: [], error: 'An unexpected error occurred' }
  }
}

// Admin: Approve a pending event
export async function approveEvent(eventId: string) {
  try {
    // Validate eventId format
    if (!isValidUUID(eventId)) {
      return { success: false, error: 'Invalid event ID format' }
    }

    const { supabase, error: adminError } = await checkAdminAccess()
    if (adminError) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: updatedRows, error } = await supabase.from('events').update({ approved: true }).eq('id', eventId).select('id')

    if (error) {
      console.error('Error approving event:', error)
      return { success: false, error: 'Failed to approve event' }
    }

    if (!updatedRows || updatedRows.length === 0) {
      return { success: false, error: 'Event could not be approved' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/event/list')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error approving event:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Admin: Reject and delete an event
export async function rejectEvent(eventId: string) {
  try {
    // Validate eventId format
    if (!isValidUUID(eventId)) {
      return { success: false, error: 'Invalid event ID format' }
    }

    const { supabase, error: adminError } = await checkAdminAccess()
    if (adminError) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data: deletedRows, error } = await supabase.from('events').delete().eq('id', eventId).select('id')

    if (error) {
      console.error('Error rejecting event:', error)
      return { success: false, error: 'Failed to reject event' }
    }

    if (!deletedRows || deletedRows.length === 0) {
      return { success: false, error: 'Event could not be rejected' }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error rejecting event:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
