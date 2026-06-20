/**
 * Migration utilities: Supabase → Neon Postgres + Better Auth
 *
 * Usage:
 *   bun run scripts/migrate-to-neon.ts schema     # Apply Neon schema
 *   bun run scripts/migrate-to-neon.ts staging    # Copy auth.users → staging (needs SUPABASE_DB_URL)
 *   bun run scripts/migrate-to-neon.ts users      # Migrate staging → Better Auth
 *   bun run scripts/migrate-to-neon.ts data       # Copy public.* via REST API (HTTPS)
 *   bun run scripts/migrate-to-neon.ts run        # schema → staging → users → data → verify
 *   bun run scripts/migrate-to-neon.ts status     # Show checkpoints and Neon counts
 *
 * Env:
 *   DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY (or VITE_*)
 *   SUPABASE_DB_URL — optional, for direct Postgres / auth staging
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const NEON_URL = process.env.DATABASE_URL;
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

const ORDERED_PHASES = ["schema", "staging", "users", "data", "verify"] as const;
type PhaseName = (typeof ORDERED_PHASES)[number];

type CliOptions = {
  append: boolean;
  allowStagingFailure: boolean;
  dryRun: boolean;
  failOnMismatch: boolean;
  force: boolean;
  from?: PhaseName;
  skipCompleted: boolean;
  tables?: string[];
  to?: PhaseName;
};

const PUBLIC_DATA_TABLES = [
  "categories",
  "users",
  "projects",
  "posts",
  "post_tags",
  "blog_post_tags",
  "comments",
  "likes",
  "views",
  "blog_reports",
  "events",
  "vibe_videos",
  "faqs",
] as const;

function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function parsePhase(value: string | undefined, fallback?: PhaseName): PhaseName | undefined {
  if (!value) return fallback;
  if ((ORDERED_PHASES as readonly string[]).includes(value)) return value as PhaseName;
  throw new Error(`Unknown phase "${value}". Expected one of: ${ORDERED_PHASES.join(", ")}`);
}

function parseArgs(argv = process.argv.slice(3)): CliOptions {
  const options: CliOptions = {
    append: false,
    allowStagingFailure: false,
    dryRun: false,
    failOnMismatch: false,
    force: false,
    skipCompleted: false,
  };

  for (const arg of argv) {
    if (arg === "--append") options.append = true;
    else if (arg === "--allow-staging-failure") options.allowStagingFailure = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--fail-on-mismatch") options.failOnMismatch = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--skip-completed") options.skipCompleted = true;
    else if (arg.startsWith("--from=")) options.from = parsePhase(arg.slice("--from=".length));
    else if (arg.startsWith("--to=")) options.to = parsePhase(arg.slice("--to=".length));
    else if (arg.startsWith("--tables=")) {
      options.tables = arg
        .slice("--tables=".length)
        .split(",")
        .map((table) => table.trim())
        .filter(Boolean);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function requireDestructiveConfirm(label: string, options: CliOptions) {
  if (options.force || process.env.MIGRATE_CONFIRM === "destroy") return;
  throw new Error(`${label} is destructive. Re-run with --force or MIGRATE_CONFIRM=destroy.`);
}

async function ensureCheckpointTable(db: postgres.Sql) {
  await db`
    CREATE TABLE IF NOT EXISTS _migration_checkpoints (
      phase TEXT PRIMARY KEY,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      source_counts JSONB,
      target_counts JSONB,
      notes TEXT
    )
  `;
}

async function getCheckpoint(db: postgres.Sql, phase: string) {
  await ensureCheckpointTable(db);
  const [checkpoint] = await db`
    SELECT phase, completed_at, source_counts, target_counts, notes
    FROM _migration_checkpoints
    WHERE phase = ${phase}
    LIMIT 1
  `;
  return checkpoint;
}

async function recordCheckpoint(
  db: postgres.Sql,
  phase: string,
  counts: { source?: Record<string, number>; target?: Record<string, number>; notes?: string } = {},
) {
  await ensureCheckpointTable(db);
  await db`
    INSERT INTO _migration_checkpoints (phase, source_counts, target_counts, notes)
    VALUES (${phase}, ${counts.source ? db.json(counts.source) : null}, ${counts.target ? db.json(counts.target) : null}, ${counts.notes ?? null})
    ON CONFLICT (phase) DO UPDATE SET
      completed_at = NOW(),
      source_counts = EXCLUDED.source_counts,
      target_counts = EXCLUDED.target_counts,
      notes = EXCLUDED.notes
  `;
}

async function clearCheckpoint(db: postgres.Sql, phase: string) {
  await ensureCheckpointTable(db);
  await db`DELETE FROM _migration_checkpoints WHERE phase = ${phase}`;
}

function getSupabaseRestConfig() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Set SUPABASE_URL + SUPABASE_ANON_KEY (or VITE_SUPABASE_* / NEXT_PUBLIC_SUPABASE_*) for REST migration",
    );
  }

  return { url: url.replace(/\/$/, ""), key };
}

async function fetchTableViaRest(table: string): Promise<Record<string, unknown>[]> {
  const { url, key } = getSupabaseRestConfig();
  const pageSize = 1000;
  const all: Record<string, unknown>[] = [];
  let offset = 0;

  while (true) {
    const endpoint = `${url}/rest/v1/${table}?select=*`;
    const response = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Range: `${offset}-${offset + pageSize - 1}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`REST fetch ${table} failed (${response.status}): ${body}`);
    }

    const batch = (await response.json()) as Record<string, unknown>[];
    if (!Array.isArray(batch) || batch.length === 0) break;

    all.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }

  return all;
}

async function fetchTableCountViaRest(table: string): Promise<number | null> {
  const { url, key } = getSupabaseRestConfig();
  const response = await fetch(`${url}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });

  if (!response.ok) return null;

  const contentRange = response.headers.get("content-range");
  const total = contentRange?.split("/")[1];
  return total && total !== "*" ? Number(total) : null;
}

function normalizeRow(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const out = { ...row };

  if (table === "users" && out.id != null) {
    out.id = String(out.id);
  }

  for (const [key, value] of Object.entries(out)) {
    if (key.endsWith("_id") && value != null && typeof value !== "number") {
      out[key] = String(value);
    }
  }

  return out;
}

const IDENTITY_TABLES = new Set(["projects"]);

async function insertRows(
  target: postgres.Sql,
  table: string,
  rows: Record<string, unknown>[],
): Promise<number> {
  if (rows.length === 0) return 0;

  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize).map((row) => normalizeRow(table, row));

    if (IDENTITY_TABLES.has(table)) {
      for (const row of batch) {
        const normalized = normalizeRow(table, row);
        const columns = Object.keys(normalized);
        const values = Object.values(normalized);
        const columnList = columns.map((column) => `"${column}"`).join(", ");
        const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
        await target.unsafe(
          `INSERT INTO ${table} (${columnList}) OVERRIDING SYSTEM VALUE VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values as never[],
        );
      }
    } else if (table === "users") {
      await target`
        INSERT INTO ${target(table)} ${target(batch)}
        ON CONFLICT (id) DO NOTHING
      `;
    } else {
      await target`
        INSERT INTO ${target(table)} ${target(batch)}
        ON CONFLICT DO NOTHING
      `;
    }

    inserted += batch.length;
  }

  return inserted;
}

async function clearPublicDataTables(target: postgres.Sql, options: CliOptions, tables: string[]) {
  requireDestructiveConfirm("TRUNCATE public data tables", options);

  const truncateOrder = [
    "blog_post_tags",
    "blog_reports",
    "views",
    "likes",
    "comments",
    "post_tags",
    "posts",
    "projects",
    "events",
    "vibe_videos",
    "faqs",
    "categories",
    "users",
  ].filter((table) => tables.includes(table));

  for (const table of truncateOrder) {
    await target`TRUNCATE TABLE ${target(table)} CASCADE`;
  }
}

async function applySchema(options: CliOptions) {
  const neonUrl = requireEnv("DATABASE_URL", NEON_URL);
  const db = postgres(neonUrl, { max: 1 });
  const migrationDir = join(import.meta.dirname, "migrations/neon");
  const migrationFiles = readdirSync(migrationDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    const schemaSql = readFileSync(join(migrationDir, file), "utf-8");
    if (options.dryRun) {
      console.log(`[dry-run] Would apply ${file} (${schemaSql.length} bytes)`);
      continue;
    }
    console.log(`Applying ${file}...`);
    await db.unsafe(schemaSql);
  }

  if (!options.dryRun) {
    await recordCheckpoint(db, "schema", { target: { files: migrationFiles.length } });
  }
  await db.end();
  console.log("Schema applied successfully.");
}

async function createPostgresSource() {
  const supabaseUrl = requireEnv("SUPABASE_DB_URL", SUPABASE_DB_URL);
  return postgres(supabaseUrl, { max: 1, connect_timeout: 20, ssl: "require" });
}

async function copyAuthStaging(options: CliOptions) {
  const neonUrl = requireEnv("DATABASE_URL", NEON_URL);
  const source = await createPostgresSource();
  const target = postgres(neonUrl, { max: 1 });

  console.log("Copying auth.users to staging...");
  const authUsers = await source`
    SELECT id, email, encrypted_password, email_confirmed_at,
           raw_user_meta_data, created_at, updated_at, is_anonymous
    FROM auth.users
  `;
  if (!options.append) {
    requireDestructiveConfirm("TRUNCATE Supabase auth staging tables", options);
    if (options.dryRun) {
      console.log("[dry-run] Would truncate supabase_auth_staging.users");
    } else {
      await target`TRUNCATE supabase_auth_staging.users`;
    }
  }
  const userBatchSize = 100;
  for (let i = 0; i < authUsers.length; i += userBatchSize) {
    const batch = authUsers.slice(i, i + userBatchSize);
    if (options.dryRun) continue;
    await target`
      INSERT INTO supabase_auth_staging.users
      ${target(batch, "id", "email", "encrypted_password", "email_confirmed_at", "raw_user_meta_data", "created_at", "updated_at", "is_anonymous")}
      ON CONFLICT DO NOTHING
    `;
  }
  console.log(`  ✓ ${authUsers.length} auth users staged`);

  const identities = await source`
    SELECT id, user_id, provider, identity_data, created_at, updated_at
    FROM auth.identities
  `;
  if (!options.append) {
    if (options.dryRun) {
      console.log("[dry-run] Would truncate supabase_auth_staging.identities");
    } else {
      await target`TRUNCATE supabase_auth_staging.identities`;
    }
  }
  const identityBatchSize = 100;
  for (let i = 0; i < identities.length; i += identityBatchSize) {
    const batch = identities.slice(i, i + identityBatchSize);
    if (options.dryRun) continue;
    await target`
      INSERT INTO supabase_auth_staging.identities
      ${target(batch, "id", "user_id", "provider", "identity_data", "created_at", "updated_at")}
      ON CONFLICT DO NOTHING
    `;
  }
  console.log(`  ✓ ${identities.length} identities staged`);

  if (!options.dryRun) {
    await recordCheckpoint(target, "staging", {
      source: { users: authUsers.length, identities: identities.length },
      target: { users: authUsers.length, identities: identities.length },
    });
  }

  await source.end();
  await target.end();
}

const POSTGRES_ONLY_TABLES = new Set(["views"]);

async function fetchTableViaPostgres(
  source: postgres.Sql,
  table: string,
): Promise<Record<string, unknown>[]> {
  const rows = await source.unsafe(`SELECT * FROM ${table}`);
  return rows as Record<string, unknown>[];
}

async function copyPublicDataViaRest(options: CliOptions) {
  const neonUrl = requireEnv("DATABASE_URL", NEON_URL);
  const target = postgres(neonUrl, { max: 1 });
  const source =
    POSTGRES_ONLY_TABLES.size > 0 && SUPABASE_DB_URL ? await createPostgresSource() : null;

  const requestedTables = options.tables ?? [...PUBLIC_DATA_TABLES];
  const invalidTables = requestedTables.filter(
    (table) => !(PUBLIC_DATA_TABLES as readonly string[]).includes(table),
  );
  if (invalidTables.length > 0) {
    throw new Error(`Unknown public data table(s): ${invalidTables.join(", ")}`);
  }

  console.log("Using Supabase REST API (HTTPS) for data export...");
  if (!options.append) {
    if (options.dryRun) {
      console.log(`[dry-run] Would truncate public tables: ${requestedTables.join(", ")}`);
    } else {
      await clearPublicDataTables(target, options, requestedTables);
    }
  }

  const sourceCounts: Record<string, number> = {};
  const targetCounts: Record<string, number> = {};

  for (const table of requestedTables) {
    console.log(`Copying ${table}...`);
    const rows =
      POSTGRES_ONLY_TABLES.has(table) && source
        ? await fetchTableViaPostgres(source, table)
        : await fetchTableViaRest(table);
    sourceCounts[table] = rows.length;
    if (rows.length === 0) {
      targetCounts[table] = 0;
      console.log("  (empty)");
      continue;
    }

    const count = options.dryRun ? rows.length : await insertRows(target, table, rows);
    targetCounts[table] = count;
    console.log(`  ✓ ${count} rows`);
  }

  // Reset projects identity sequence after explicit id inserts
  if (!options.dryRun && requestedTables.includes("projects")) {
    await target`
      SELECT setval(
        pg_get_serial_sequence('projects', 'id'),
        COALESCE((SELECT MAX(id) FROM projects), 1)
      )
    `;
  }

  if (!options.dryRun) {
    await recordCheckpoint(target, "data", { source: sourceCounts, target: targetCounts });
  }

  await target.end();
  if (source) await source.end();
  console.log("Data copy complete (REST).");
}

type StagedUser = {
  id: string;
  email: string | null;
  encrypted_password: string | null;
  email_confirmed_at: Date | null;
  raw_user_meta_data: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
  is_anonymous: boolean;
  identities: Array<{
    provider: string;
    identity_data: { sub?: string; email?: string } | null;
    created_at: Date | null;
    updated_at: Date | null;
  }>;
};

async function migrateUsersToBetterAuth(options: CliOptions) {
  const neonUrl = requireEnv("DATABASE_URL", NEON_URL);
  const pg = postgres(neonUrl, { max: 1 });

  const users = await pg<StagedUser[]>`
    SELECT
      u.*,
      COALESCE(
        json_agg(i.* ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL),
        '[]'::json
      ) AS identities
    FROM supabase_auth_staging.users u
    LEFT JOIN supabase_auth_staging.identities i ON u.id = i.user_id
    GROUP BY u.id
  `;

  if (users.length === 0) {
    throw new Error("No staged auth users found. Run `staging` first.");
  }

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    if (!user.email) {
      skipped++;
      continue;
    }

    const meta = user.raw_user_meta_data ?? {};
    const displayName =
      (meta.full_name as string) || (meta.name as string) || user.email.split("@")[0] || "User";
    const userId = String(user.id);

    if (!options.dryRun) {
      await pg`
        INSERT INTO "user" (id, name, email, email_verified, image, created_at, updated_at)
        VALUES (
          ${userId},
          ${displayName},
          ${user.email},
          ${Boolean(user.email_confirmed_at)},
          ${(meta.avatar_url as string) || null},
          ${user.created_at},
          ${user.updated_at}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email_verified = EXCLUDED.email_verified,
          image = COALESCE("user".image, EXCLUDED.image),
          updated_at = EXCLUDED.updated_at
      `;
    }

    const identities = Array.isArray(user.identities) ? user.identities : [];

    if (user.encrypted_password) {
      if (!options.dryRun) {
        await pg`
        INSERT INTO account (id, user_id, provider_id, account_id, password, created_at, updated_at)
        VALUES (
          ${crypto.randomUUID()},
          ${userId},
          'credential',
          ${userId},
          ${user.encrypted_password},
          ${user.created_at},
          ${user.updated_at}
        )
        ON CONFLICT (user_id, provider_id) DO UPDATE SET
          account_id = EXCLUDED.account_id,
          password = COALESCE(account.password, EXCLUDED.password),
          updated_at = EXCLUDED.updated_at
        `;
      }
    }

    for (const identity of identities) {
      if (identity.provider === "email") continue;

      for (const provider of ["google", "github"] as const) {
        if (identity.provider !== provider) continue;

        if (!options.dryRun) {
          await pg`
          INSERT INTO account (id, user_id, provider_id, account_id, created_at, updated_at)
          VALUES (
            ${crypto.randomUUID()},
            ${userId},
            ${provider},
            ${identity.identity_data?.sub ?? userId},
            ${identity.created_at ?? user.created_at},
            ${identity.updated_at ?? user.updated_at}
          )
          ON CONFLICT (user_id, provider_id) DO UPDATE SET
            account_id = EXCLUDED.account_id,
            updated_at = EXCLUDED.updated_at
          `;
        }
      }
    }

    migrated++;
    if (migrated % 100 === 0) console.log(`  migrated ${migrated}/${users.length}...`);
  }

  if (!options.dryRun) {
    await recordCheckpoint(pg, "users", {
      source: { stagedUsers: users.length },
      target: { migrated, skipped },
    });
  }

  await pg.end();
  console.log(`User migration complete: ${migrated} migrated, ${skipped} skipped.`);
}

async function getNeonCounts(
  pg: postgres.Sql,
  tables = ["user", "users", "projects", "views", "account"],
) {
  const counts: Record<string, number> = {};
  for (const table of tables) {
    const tableName = table === "user" ? '"user"' : table;
    const [row] = await pg.unsafe(`SELECT COUNT(*)::int AS count FROM ${tableName}`);
    counts[table] = Number(row?.count ?? 0);
  }
  return counts;
}

async function verifyCounts(options: CliOptions) {
  const neonUrl = requireEnv("DATABASE_URL", NEON_URL);
  const pg = postgres(neonUrl, { max: 1 });
  const targetCounts = await getNeonCounts(pg, ["user", "users", "account", ...PUBLIC_DATA_TABLES]);
  const sourceCounts: Record<string, number> = {};
  const mismatches: string[] = [];

  if (SUPABASE_DB_URL) {
    const source = await createPostgresSource();
    const [authCount] = await source`SELECT COUNT(*)::int AS count FROM auth.users`;
    sourceCounts.user = Number(authCount?.count ?? 0);
    await source.end();
  }

  for (const table of PUBLIC_DATA_TABLES) {
    if (POSTGRES_ONLY_TABLES.has(table) && SUPABASE_DB_URL) {
      const source = await createPostgresSource();
      const [row] = await source.unsafe(`SELECT COUNT(*)::int AS count FROM ${table}`);
      sourceCounts[table] = Number(row?.count ?? 0);
      await source.end();
    } else {
      try {
        const count = await fetchTableCountViaRest(table);
        if (count != null) sourceCounts[table] = count;
      } catch {
        // REST config is optional for auth-only verification.
      }
    }
  }

  for (const [table, sourceCount] of Object.entries(sourceCounts)) {
    const targetCount = targetCounts[table];
    if (targetCount != null && sourceCount !== targetCount) {
      mismatches.push(`${table}: source=${sourceCount}, neon=${targetCount}`);
    }
  }

  console.log("Neon counts:", targetCounts);
  if (Object.keys(sourceCounts).length > 0) {
    console.log("Source counts:", sourceCounts);
  }
  if (mismatches.length > 0) {
    console.warn("Count mismatches:");
    for (const mismatch of mismatches) console.warn(`  - ${mismatch}`);
    if (options.failOnMismatch) {
      throw new Error("Verification failed due to count mismatches.");
    }
  }

  await recordCheckpoint(pg, "verify", {
    source: sourceCounts,
    target: targetCounts,
    notes: mismatches.length > 0 ? mismatches.join("; ") : "ok",
  });
  await pg.end();
}

async function printStatus() {
  const neonUrl = requireEnv("DATABASE_URL", NEON_URL);
  const pg = postgres(neonUrl, { max: 1 });
  await ensureCheckpointTable(pg);
  const checkpoints = await pg`
    SELECT phase, completed_at, source_counts, target_counts, notes
    FROM _migration_checkpoints
    ORDER BY completed_at
  `;
  const counts = await getNeonCounts(pg);
  console.log("Migration checkpoints:", checkpoints);
  console.log("Neon counts:", counts);
  await pg.end();
}

async function runPhase(phase: PhaseName, options: CliOptions) {
  const neonUrl = requireEnv("DATABASE_URL", NEON_URL);
  const pg = postgres(neonUrl, { max: 1 });
  const checkpoint = await getCheckpoint(pg, phase);

  if (checkpoint && (options.skipCompleted || !options.force)) {
    console.log(`Skipping ${phase}; checkpoint exists. Use --force to rerun.`);
    await pg.end();
    return;
  }

  if (options.force) {
    await clearCheckpoint(pg, phase);
  }
  await pg.end();

  switch (phase) {
    case "schema":
      await applySchema(options);
      break;
    case "staging":
      await copyAuthStaging(options);
      break;
    case "users":
      await migrateUsersToBetterAuth(options);
      break;
    case "data":
      await copyPublicDataViaRest(options);
      break;
    case "verify":
      await verifyCounts(options);
      break;
  }
}

async function runPhases(options: CliOptions) {
  const fromIndex = ORDERED_PHASES.indexOf(parsePhase(options.from, "schema") ?? "schema");
  const toIndex = ORDERED_PHASES.indexOf(parsePhase(options.to, "verify") ?? "verify");
  if (fromIndex > toIndex) {
    throw new Error("--from phase must come before --to phase");
  }

  for (const phase of ORDERED_PHASES.slice(fromIndex, toIndex + 1)) {
    try {
      await runPhase(phase, options);
    } catch (error) {
      if (phase === "staging" && options.allowStagingFailure) {
        console.warn(
          "Direct Postgres staging failed. Populate supabase_auth_staging manually, then re-run `users`.",
        );
        console.warn(error instanceof Error ? error.message : error);
        continue;
      }
      throw error;
    }
  }
}

async function main() {
  const command = process.argv[2] ?? "help";
  const options = parseArgs();

  switch (command) {
    case "schema":
      await runPhase("schema", options);
      break;
    case "staging":
      await runPhase("staging", options);
      break;
    case "data":
      await runPhase("data", options);
      break;
    case "users":
      await runPhase("users", options);
      break;
    case "verify":
      await runPhase("verify", options);
      break;
    case "run":
      await runPhases(options);
      break;
    case "all":
      await runPhases({ ...options, from: options.from ?? "schema", to: options.to ?? "verify" });
      break;
    case "status":
      await printStatus();
      break;
    default:
      console.log(
        "Usage: bun run scripts/migrate-to-neon.ts <schema|staging|users|data|verify|run|all|status> [--force] [--skip-completed] [--append] [--tables=a,b] [--dry-run] [--fail-on-mismatch]",
      );
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
