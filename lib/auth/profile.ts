import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

interface CreateProfileInput {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  username?: string | null;
}

function sanitizeUsername(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (cleaned.length >= 3) return cleaned;
  return `user_${crypto.randomUUID().slice(0, 8)}`;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

/** Repair helper for migrated users or deployments where the DB trigger was not yet installed. */
export async function createUserProfile(input: CreateProfileInput): Promise<void> {
  const db = getDb();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, input.id))
    .limit(1);

  if (existing.length > 0) return;

  const emailPrefix = input.email.split("@")[0] ?? "user";
  const baseUsername = sanitizeUsername(input.username || input.name || emailPrefix || input.id);
  const displayName = input.name || input.username || emailPrefix || "User";

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const username = attempt === 0 ? baseUsername : `${baseUsername}_${attempt}`;

    try {
      await db
        .insert(users)
        .values({
          id: input.id,
          username,
          displayName,
          avatarUrl: input.image ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            displayName,
            avatarUrl: input.image ?? null,
            updatedAt: new Date(),
          },
        });
      return;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }

  throw new Error(`Unable to create unique profile username for user ${input.id}`);
}
