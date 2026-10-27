/**
 * Leftover sign-in methods after the move to email OTP: password (`credential`)
 * and Google/GitHub OAuth rows in Better Auth's `account` table. Users keep
 * their `user` row, so they sign in by OTP to the same account.
 */
export const LEGACY_PROVIDERS = ["credential", "google", "github"] as const;
export type LegacyProvider = (typeof LEGACY_PROVIDERS)[number];

export type Query = (text: string, params: unknown[]) => Promise<Record<string, unknown>[]>;

export type CleanupArgs = { apply: boolean };

export type CleanupCounts = {
  total: number;
  byProvider: Record<LegacyProvider, number>;
  users: number;
};

export function parseCleanupArgs(argv: readonly string[]): CleanupArgs {
  const unknown = argv.filter((arg) => arg !== "--apply" && arg !== "--dry-run");
  if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown[0]}`);
  return { apply: argv.includes("--apply") && !argv.includes("--dry-run") };
}

/**
 * `--apply` needs `CONFIRM_DATABASE_HOST` to equal the database host, so the
 * delete never runs against a database by accident. Only the match result is
 * reported, never the host.
 */
export function assertApplyAllowed(databaseUrl: string, confirmHost: string | undefined): void {
  let host: string;
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    throw new Error("Database URL is not a valid URL.");
  }
  if (!confirmHost)
    throw new Error("--apply needs CONFIRM_DATABASE_HOST set to the database host.");
  if (confirmHost.trim().toLowerCase() !== host.toLowerCase()) {
    throw new Error("CONFIRM_DATABASE_HOST does not match the database host. Nothing was deleted.");
  }
}

export async function countLegacyAccounts(query: Query): Promise<CleanupCounts> {
  const rows = await query(
    `select provider_id, count(*)::int as count from "account" where provider_id = any($1) group by provider_id`,
    [LEGACY_PROVIDERS],
  );
  const byProvider: Record<LegacyProvider, number> = { credential: 0, google: 0, github: 0 };
  for (const row of rows) {
    const provider = row.provider_id as LegacyProvider;
    if (provider in byProvider) byProvider[provider] = Number(row.count);
  }
  const [users] = await query(
    `select count(distinct user_id)::int as count from "account" where provider_id = any($1)`,
    [LEGACY_PROVIDERS],
  );
  return {
    total: byProvider.credential + byProvider.google + byProvider.github,
    byProvider,
    users: Number(users?.count ?? 0),
  };
}

/** Idempotent: a second run finds nothing and deletes nothing. */
export async function deleteLegacyAccounts(query: Query): Promise<number> {
  const rows = await query(
    `delete from "account" where provider_id = any($1) returning 1 as deleted`,
    [LEGACY_PROVIDERS],
  );
  return rows.length;
}

export function formatCounts(label: string, counts: CleanupCounts): string {
  return [
    `${label}: ${counts.total} legacy account rows (${counts.users} users)`,
    `  credential: ${counts.byProvider.credential}`,
    `  google: ${counts.byProvider.google}`,
    `  github: ${counts.byProvider.github}`,
  ].join("\n");
}

export async function runLegacyAuthCleanup(input: {
  args: CleanupArgs;
  databaseUrl: string;
  confirmHost: string | undefined;
  query: Query;
  log: (line: string) => void;
}): Promise<{ before: CleanupCounts; deleted: number }> {
  if (input.args.apply) assertApplyAllowed(input.databaseUrl, input.confirmHost);

  const before = await countLegacyAccounts(input.query);
  input.log(formatCounts(input.args.apply ? "Before" : "Dry run", before));
  if (!input.args.apply) {
    input.log("Nothing deleted. Re-run with --apply and CONFIRM_DATABASE_HOST to delete.");
    return { before, deleted: 0 };
  }

  const deleted = before.total === 0 ? 0 : await deleteLegacyAccounts(input.query);
  input.log(`Deleted ${deleted} rows.`);
  input.log(formatCounts("After", await countLegacyAccounts(input.query)));
  return { before, deleted };
}
