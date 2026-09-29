import { getRequest } from "@tanstack/react-start/server";
import { isBotUserAgent } from "@/lib/bot-user-agent";
import { getDb } from "@/lib/db";
import { views } from "@/lib/db/schema";
import { getServerSession } from "@/lib/server/auth";
import { getProjectIdBySlug, isPgUniqueViolation, isValidSlug } from "@/lib/slug";

const SESSION_ID_PATTERN = /^[A-Za-z0-9-]{8,80}$/;

/**
 * Record one project view for this browser session and calendar day.
 * A repeat call for the same session hits the unique index and is ignored.
 */
export async function recordProjectView(slug: string, sessionId: string): Promise<void> {
  const normalizedSlug = slug.trim();
  const normalizedSession = sessionId.trim();
  if (!isValidSlug(normalizedSlug) || !SESSION_ID_PATTERN.test(normalizedSession)) {
    return;
  }

  let userAgent: string | null = null;
  try {
    userAgent = getRequest().headers.get("user-agent");
  } catch {
    userAgent = null;
  }
  if (isBotUserAgent(userAgent)) return;

  const projectIdStr = await getProjectIdBySlug(normalizedSlug);
  const projectId = Number(projectIdStr);
  if (!projectIdStr || !Number.isInteger(projectId) || projectId <= 0) return;

  const session = await getServerSession();
  const db = getDb();
  const viewDate = new Date().toISOString().slice(0, 10);

  try {
    await db.insert(views).values({
      projectId,
      userId: session?.user?.id ?? null,
      sessionId: normalizedSession,
      viewDate,
    });
  } catch (error) {
    if (!isPgUniqueViolation(error)) {
      console.error("recordProjectView failed:", error);
    }
  }
}
