/**
 * Report (and optionally delete) password and Google/GitHub `account` rows left
 * over from before email OTP sign-in. Users and profiles are not touched; the
 * same people sign in by OTP to the same account.
 *
 * Prints counts only. Never prints emails, ids, or the database URL.
 *
 *   bun run scripts/cleanup-legacy-auth-accounts.ts            # dry run (default)
 *   CONFIRM_DATABASE_HOST=<db host> \
 *     bun run scripts/cleanup-legacy-auth-accounts.ts --apply  # delete
 *
 * Uses DATABASE_URL_UNPOOLED, then DATABASE_URL, from the environment or
 * .env / .env.local. Safe to re-run.
 */

import { neon } from "@neondatabase/serverless";
import { parseCleanupArgs, runLegacyAuthCleanup } from "@/lib/server/legacy-auth-cleanup";
import { loadSeedEnv } from "./seed/env";

async function main() {
  const args = parseCleanupArgs(process.argv.slice(2));
  loadSeedEnv();
  const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("Set DATABASE_URL_UNPOOLED or DATABASE_URL.");

  const sql = neon(databaseUrl);
  await runLegacyAuthCleanup({
    args,
    databaseUrl,
    confirmHost: process.env.CONFIRM_DATABASE_HOST,
    query: (text, params) => sql.query(text, params) as Promise<Record<string, unknown>[]>,
    log: (line) => console.log(line),
  });
}

main().catch((error: unknown) => {
  console.log(error instanceof Error ? error.message : "Cleanup failed.");
  process.exit(1);
});
