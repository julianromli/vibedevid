import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const SUSPENDED_ACCOUNT_MESSAGE = "This account is suspended";

/** Returns an error message when this account must not create or change content. */
export async function mutationBlockReason(userId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ isSuspended: users.isSuspended })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (row?.isSuspended) return SUSPENDED_ACCOUNT_MESSAGE;
  return null;
}
