import { createServerOnlyFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerRuntimeSecrets } from "@/lib/server/runtime-secrets";
import * as schema from "./schema";

/** Cloudflare Hyperdrive binding (`hyperdrive[].binding = "HYPERDRIVE"` in wrangler.jsonc). */
interface HyperdriveBinding {
  connectionString: string;
}

/**
 * Connection string for this Worker invocation.
 * 1. `env.HYPERDRIVE.connectionString` (Workers fetch and scheduled handlers; Nitro sets
 *    `globalThis.__env__` before either runs).
 * 2. `DATABASE_URL` (local dev, tests, Node scripts).
 */
export function resolveDatabaseUrl(): string {
  const env = (globalThis as { __env__?: { HYPERDRIVE?: HyperdriveBinding } }).__env__;
  const fromHyperdrive = env?.HYPERDRIVE?.connectionString;
  if (fromHyperdrive) return fromHyperdrive;

  const { databaseUrl } = getServerRuntimeSecrets();
  if (!databaseUrl) {
    throw new Error("No database configured: bind HYPERDRIVE or set DATABASE_URL");
  }
  return databaseUrl;
}

/**
 * New Drizzle client over postgres.js. Opens no socket until the first query.
 * `max: 5` stays under the Workers limit of 6 open connections per invocation.
 * `fetch_types: false` skips a type-lookup round trip per connection; Drizzle
 * parses `text[]` columns itself.
 */
export function createDb(connectionString: string = resolveDatabaseUrl()) {
  const client = postgres(connectionString, { max: 5, fetch_types: false });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;

// createServerOnlyFn lets the Start compiler drop `@tanstack/react-start/server`
// from client bundles. Some client-reachable modules import this file; a static
// getRequest import there runs h3's AsyncLocalStorage setup in the browser,
// which throws at module eval and stops React from hydrating.
const currentRequest = createServerOnlyFn((): Request | undefined => {
  try {
    return getRequest();
  } catch {
    // Outside a TanStack Start request: cron, scripts, tests.
    return undefined;
  }
});

/** One client per request. Workers cannot reuse a TCP socket across requests. */
const requestDbs = new WeakMap<Request, Db>();

/**
 * Server-only Drizzle client for the current request.
 * Inside a request: the same client for every call in that request.
 * Outside a request (cron, scripts): a new client per call. Keep it for the job.
 */
export function getDb(): Db {
  const request = currentRequest();
  if (!request) return createDb();

  let db = requestDbs.get(request);
  if (!db) {
    db = createDb();
    requestDbs.set(request, db);
  }
  return db;
}

export { schema };
