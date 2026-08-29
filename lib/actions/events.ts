import { revalidatePath, revalidateTag } from "@/lib/revalidation";
import { validateEventForm } from "@/lib/event-form-utils";
import { getDb } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { toEventDto } from "@/lib/db/mappers";
import { requireAdminOrModeratorUser, requireUser } from "@/lib/server/auth";
import { slugifyTitle } from "@/lib/slug";
import { eq, desc } from "drizzle-orm";
import type { EventFormData } from "@/types/events";

const isSlugConflict = (error: unknown): boolean => {
  const pgError = error as { code?: string; message?: string };
  return (
    pgError?.code === "23505" &&
    typeof pgError.message === "string" &&
    pgError.message.includes("slug")
  );
};

async function checkAdminAccess() {
  try {
    await requireAdminOrModeratorUser();
    return { error: null };
  } catch {
    return { error: "Unauthorized" as const };
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

    const baseSlug = formData.slug?.trim() || slugifyTitle(formData.name);
    const ensureUniqueEventSlug = async (base: string): Promise<string> => {
      let candidate = base;
      let attempt = 1;
      while (attempt <= 100) {
        const [existing] = await db
          .select({ slug: events.slug })
          .from(events)
          .where(eq(events.slug, candidate))
          .limit(1);
        if (!existing) {
          return candidate;
        }
        attempt += 1;
        candidate = `${base}-${attempt}`;
      }
      throw new Error("Slug uniqueness exhausted after 100 attempts");
    };

    const slug = await ensureUniqueEventSlug(baseSlug);

    const insertEvent = (resolutionSlug: string) =>
      db.insert(events).values({
        slug: resolutionSlug,
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

    try {
      await insertEvent(slug);
    } catch (error) {
      if (!isSlugConflict(error)) {
        throw error;
      }
      const retrySlug = await ensureUniqueEventSlug(baseSlug);
      await insertEvent(retrySlug);
    }

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
