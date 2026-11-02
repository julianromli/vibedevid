import { lt } from "drizzle-orm";
import { type Db, getDb } from "@/lib/db";
import { authSession, authVerification } from "@/lib/db/schema";

/**
 * Daily Workers cron at 03:17 UTC (10:17 WIB), when traffic usually has Neon awake anyway.
 * See `triggers.crons` in wrangler.jsonc.
 * Keep the two in sync: the scheduled handler only runs this job for this exact string.
 */
export const AUTH_CLEANUP_CRON = "17 3 * * *";

/** Delete expired Better Auth sessions and OTP verifications. */
export async function deleteExpiredAuthRows(
  db: Db = getDb(),
  now: Date = new Date(),
): Promise<void> {
  await db.delete(authSession).where(lt(authSession.expiresAt, now));
  await db.delete(authVerification).where(lt(authVerification.expiresAt, now));
}
