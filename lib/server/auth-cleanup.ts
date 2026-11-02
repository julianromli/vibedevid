import type { Db } from "@/lib/db";

export const AUTH_CLEANUP_CRON = "17 * * * *";

export async function deleteExpiredAuthRows(_db?: Db, _now?: Date): Promise<void> {
  throw new Error("not implemented");
}
