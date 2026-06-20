import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getServerRuntimeSecrets } from "@/lib/server/runtime-secrets";
import * as schema from "./schema";

let _db: ReturnType<typeof createDb> | null = null;

function createDb() {
  const { databaseUrl } = getServerRuntimeSecrets();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

/** Server-only Drizzle client (Neon HTTP driver, Workers-compatible). */
export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export type Db = ReturnType<typeof getDb>;
export { schema };
