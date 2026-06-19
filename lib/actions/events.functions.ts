import { createServerFn } from '@tanstack/react-start'
import { submitEvent as submitEventAction } from '@/lib/actions/events'
import type { EventFormData } from '@/types/events'

/**
 * Submit a new event for moderation. The underlying action performs full
 * validation and auth checks server-side; this wrapper only crosses the
 * client/server boundary.
 */
export const submitEventFn = createServerFn({ method: 'POST' })
  .validator((data: EventFormData) => data)
  .handler(async ({ data }) => {
    return submitEventAction(data)
  })
