import { revalidatePath, revalidateTag } from "@/lib/revalidation";
import { validateEventForm } from "@/lib/event-form-utils";
import { getDb } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { toEventDto } from "@/lib/db/mappers";
import { requireAdminOrModeratorUser, requireUser } from "@/lib/server/auth";
import { eq, and, ne, asc, desc } from "drizzle-orm";
import type { EventFormData } from "@/types/events";

interface GetEventsFilters {
  category?: string;
  locationType?: string;
  sort?: "nearest" | "latest";
}

async function checkAdminAccess() {
  try {
    await requireAdminOrModeratorUser();
    return { error: null };
  } catch {
    return { error: "Unauthorized" as const };
  }
}

export async function getEvents(filters: GetEventsFilters = {}) {
  const db = getDb();

  const conditions = [eq(events.approved, true)];

  if (filters.category && filters.category !== "all") {
    conditions.push(eq(events.category, filters.category));
  }

  if (filters.locationType && filters.locationType !== "all") {
    conditions.push(eq(events.locationType, filters.locationType));
  }

  try {
    const rows = await db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(filters.sort === "latest" ? desc(events.createdAt) : asc(events.date));

    return { events: rows.map(toEventDto) };
  } catch (error) {
    console.error("Error fetching events:", error);
    return { events: [], error: "Failed to fetch events" };
  }
}

export async function getEventBySlug(slug: string) {
  if (!slug || typeof slug !== "string") {
    return { event: null, error: "Invalid slug parameter" };
  }

  const sanitizedSlug = slug.trim().toLowerCase();
  if (sanitizedSlug.length === 0 || sanitizedSlug.length > 200) {
    return { event: null, error: "Invalid slug format" };
  }

  const db = getDb();

  try {
    const [row] = await db.select().from(events).where(eq(events.slug, sanitizedSlug)).limit(1);

    if (!row) {
      return { event: null, error: "Failed to fetch event" };
    }

    return { event: toEventDto(row) };
  } catch (error) {
    console.error("Error fetching event by slug:", error);
    return { event: null, error: "Failed to fetch event" };
  }
}

export async function getRelatedEvents(category: string, excludeId: string, limit: number = 3) {
  const db = getDb();

  try {
    const rows = await db
      .select()
      .from(events)
      .where(
        and(eq(events.category, category), ne(events.id, excludeId), eq(events.approved, true)),
      )
      .limit(limit);

    return { events: rows.map(toEventDto) };
  } catch (error) {
    console.error("Error fetching related events:", error);
    return { events: [], error: "Failed to fetch related events" };
  }
}

export async function submitEvent(formData: EventFormData) {
  try {
    const validation = validateEventForm(formData);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(", ");
      return { success: false, error: `Validation failed: ${errorMessages}` };
    }

    const user = await requireUser();
    const db = getDb();

    await db.insert(events).values({
      slug: formData.slug,
      name: formData.name,
      date: formData.date,
      time: formData.time,
      locationType: formData.locationType,
      locationDetail: formData.locationDetail,
      description: formData.description,
      organizer: formData.organizer,
      registrationUrl: formData.registrationUrl,
      coverImage: formData.coverImage,
      category: formData.category,
      status: "upcoming",
      approved: false,
      submittedBy: user.id,
    });

    revalidatePath("/event/list");
    revalidateTag("event-list-events", "max");
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { success: false, error: "You must be logged in to submit an event" };
    }
    console.error("Unexpected error submitting event:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export async function getPendingEvents() {
  try {
    const { error: adminError } = await checkAdminAccess();
    if (adminError) {
      return { events: [], error: "Unauthorized" };
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(events)
      .where(eq(events.approved, false))
      .orderBy(desc(events.createdAt));

    return { events: rows.map(toEventDto) };
  } catch (error) {
    console.error("Unexpected error fetching pending events:", error);
    return { events: [], error: "An unexpected error occurred" };
  }
}

export async function approveEvent(eventId: string) {
  try {
    if (!isValidUUID(eventId)) {
      return { success: false, error: "Invalid event ID format" };
    }

    const { error: adminError } = await checkAdminAccess();
    if (adminError) {
      return { success: false, error: "Unauthorized" };
    }

    const db = getDb();
    const updatedRows = await db
      .update(events)
      .set({ approved: true, updatedAt: new Date() })
      .where(eq(events.id, eventId))
      .returning({ id: events.id });

    if (!updatedRows.length) {
      return { success: false, error: "Event could not be approved" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/event/list");
    revalidateTag("event-list-events", "max");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error approving event:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function rejectEvent(eventId: string) {
  try {
    if (!isValidUUID(eventId)) {
      return { success: false, error: "Invalid event ID format" };
    }

    const { error: adminError } = await checkAdminAccess();
    if (adminError) {
      return { success: false, error: "Unauthorized" };
    }

    const db = getDb();
    const deletedRows = await db
      .delete(events)
      .where(eq(events.id, eventId))
      .returning({ id: events.id });

    if (!deletedRows.length) {
      return { success: false, error: "Event could not be rejected" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/event/list");
    revalidateTag("event-list-events", "max");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error rejecting event:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
