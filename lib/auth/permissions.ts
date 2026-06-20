import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const USER_ROLE = {
  ADMIN: 0,
  MODERATOR: 1,
  USER: 2,
} as const;

export function isAdminOrModerator(role: number | null | undefined): boolean {
  return role === USER_ROLE.ADMIN || role === USER_ROLE.MODERATOR;
}

export async function getUserRole(userId: string): Promise<number | null> {
  const db = getDb();
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.role ?? null;
}

export async function requireAdminOrModerator(userId: string): Promise<void> {
  const role = await getUserRole(userId);
  if (!isAdminOrModerator(role)) {
    throw new Error("Unauthorized: admin or moderator access required");
  }
}

export async function requireAdmin(userId: string): Promise<void> {
  const role = await getUserRole(userId);
  if (role !== USER_ROLE.ADMIN) {
    throw new Error("Unauthorized: admin access required");
  }
}
