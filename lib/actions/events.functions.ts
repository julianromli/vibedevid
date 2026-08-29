import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  approveEvent as approveEventAction,
  rejectEvent as rejectEventAction,
  submitEvent as submitEventAction,
} from "@/lib/actions/events";
import type { EventFormData } from "@/types/events";

/**
 * Submit a new event for moderation. The underlying action performs full
 * validation and auth checks server-side; this wrapper only crosses the
 * client/server boundary.
 */
export const submitEventFn = createServerFn({ method: "POST" })
  .validator((data: EventFormData) => data)
  .handler(async ({ data }) => {
    return submitEventAction(data);
  });

const EventIdInput = z.object({ eventId: z.string().uuid() });

export const approveEventFn = createServerFn({ method: "POST" })
  .validator(EventIdInput)
  .handler(async ({ data }) => approveEventAction(data.eventId));

export const rejectEventFn = createServerFn({ method: "POST" })
  .validator(EventIdInput)
  .handler(async ({ data }) => rejectEventAction(data.eventId));
