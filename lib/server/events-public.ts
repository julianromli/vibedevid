import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import { getSupabaseConfig } from '@/lib/env-config'
import { computeEventStatus } from '@/lib/event-status'
import type { AIEvent, EventCategory, EventLocationType } from '@/types/events'

interface EventRow {
  id: string
  slug: string
  name: string
  date: string
  time: string
  end_date: string | null
  end_time: string | null
  location_type: EventLocationType
  location_detail: string
  description: string
  organizer: string
  registration_url: string
  cover_image: string
  category: EventCategory
  created_at: string | null
}

function mapEventFromDB(data: EventRow): AIEvent {
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    date: data.date,
    time: data.time,
    endDate: data.end_date ?? undefined,
    endTime: data.end_time ?? undefined,
    locationType: data.location_type,
    locationDetail: data.location_detail,
    description: data.description,
    organizer: data.organizer,
    registrationUrl: data.registration_url,
    coverImage: data.cover_image,
    category: data.category,
    status: computeEventStatus(data.date),
    createdAt: data.created_at ?? undefined,
  }
}

async function fetchApprovedEvents(): Promise<AIEvent[]> {
  const { url, anonKey } = getSupabaseConfig()
  const supabase = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('approved', true)
    .order('date', { ascending: true })

  if (error || !data) {
    return []
  }

  return data.map((event) => mapEventFromDB(event as EventRow))
}

export const getCachedApprovedEvents = unstable_cache(fetchApprovedEvents, ['event-list-public-approved-events'], {
  revalidate: 60,
  tags: ['event-list-events'],
})
