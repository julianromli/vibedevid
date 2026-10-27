import { and, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getServerSession } from "@/lib/server/auth";
import { clientIpFromHeaders, consumeRateLimit } from "@/lib/server/rate-limit";
import {
  availabilityReason,
  suggestUsername,
  type UsernameAvailabilityReason,
  type UsernameError,
  usernameCandidates,
  validateUsername,
} from "@/lib/username";

export type UsernameStatus = "available" | "taken" | UsernameError;

export type UsernameAvailability = {
  available: boolean;
  reason?: UsernameAvailabilityReason;
  suggestions?: string[];
};

const MAX_SUGGESTIONS = 3;

export type ClaimUsernameResult =
  | { ok: true; username: string }
  | {
      ok: false;
      error: UsernameStatus | "unauthorized" | "already_claimed" | "rate_limited" | "failed";
    };

const AVAILABILITY_LIMIT = { limit: 60, windowMs: 60_000 };
const CLAIM_LIMIT = { limit: 10, windowMs: 10 * 60_000 };

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = (error as { code?: string; cause?: { code?: string } }).code;
  const causeCode = (error as { cause?: { code?: string } }).cause?.code;
  return code === "23505" || causeCode === "23505";
}

async function isTakenByOther(username: string, userId: string | null): Promise<boolean> {
  const db = getDb();
  const condition = userId
    ? and(eq(users.username, username), ne(users.id, userId))
    : eq(users.username, username);
  const [row] = await db.select({ id: users.id }).from(users).where(condition).limit(1);
  return Boolean(row);
}

async function freeSuggestions(name: string): Promise<string[]> {
  const candidates = usernameCandidates(name);
  if (candidates.length === 0) return [];
  const taken = await getDb()
    .select({ username: users.username })
    .from(users)
    .where(inArray(users.username, candidates));
  const takenSet = new Set(taken.map((row) => row.username));
  return candidates.filter((candidate) => !takenSet.has(candidate)).slice(0, MAX_SUGGESTIONS);
}

/** Live availability check for the onboarding form. */
export async function checkUsernameAvailability(input: {
  username: string;
  headers: Headers;
}): Promise<UsernameAvailability> {
  const validation = validateUsername(input.username);
  if (!validation.ok) {
    const reason = availabilityReason(validation.error);
    if (reason !== "reserved") return { available: false, reason };
    return { available: false, reason, suggestions: await freeSuggestions(input.username) };
  }

  const session = await getServerSession();
  const key = session?.user?.id ?? clientIpFromHeaders(input.headers);
  if (
    !(await consumeRateLimit(
      `username-check:${key}`,
      AVAILABILITY_LIMIT.limit,
      AVAILABILITY_LIMIT.windowMs,
    ))
  ) {
    // Do not leak availability when throttled; the claim step re-checks.
    return { available: true };
  }

  if (!(await isTakenByOther(validation.username, session?.user?.id ?? null)))
    return { available: true };
  return {
    available: false,
    reason: "taken",
    suggestions: await freeSuggestions(validation.username),
  };
}

/**
 * Claims the username once. Only rows still unclaimed are updated, so a
 * claimed user cannot use this to rename. Display name follows the username
 * while it still equals the temporary one.
 */
export async function claimUsername(input: { username: string }): Promise<ClaimUsernameResult> {
  const session = await getServerSession();
  if (!session?.user) return { ok: false, error: "unauthorized" };
  const userId = session.user.id;

  const validation = validateUsername(input.username);
  if (!validation.ok) return { ok: false, error: validation.error };
  const username = validation.username;

  if (
    !(await consumeRateLimit(`username-claim:${userId}`, CLAIM_LIMIT.limit, CLAIM_LIMIT.windowMs))
  ) {
    return { ok: false, error: "rate_limited" };
  }

  if (await isTakenByOther(username, userId)) return { ok: false, error: "taken" };

  const db = getDb();
  try {
    const updated = await db
      .update(users)
      .set({
        username,
        displayName: sql`CASE WHEN ${users.displayName} = ${users.username} THEN ${username} ELSE ${users.displayName} END`,
        usernameClaimedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, userId), isNull(users.usernameClaimedAt)))
      .returning({ id: users.id });

    if (updated.length === 0) return { ok: false, error: "already_claimed" };
    return { ok: true, username };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: "taken" };
    console.error("[onboarding] claim username failed:", error);
    return { ok: false, error: "failed" };
  }
}

/** Data the onboarding page needs: a starting suggestion and whether it is still required. */
export async function getOnboardingState(): Promise<{
  claimed: boolean;
  suggestion: string;
} | null> {
  const session = await getServerSession();
  if (!session?.user) return null;

  const db = getDb();
  const [profile] = await db
    .select({ claimedAt: users.usernameClaimedAt })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return { claimed: Boolean(profile?.claimedAt), suggestion: suggestUsername(session.user.email) };
}
