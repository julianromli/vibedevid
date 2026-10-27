import { describe, expect, it } from "vite-plus/test";
import {
  assertApplyAllowed,
  parseCleanupArgs,
  type Query,
  runLegacyAuthCleanup,
} from "@/lib/server/legacy-auth-cleanup";

const URL_ = "postgresql://user:pw@ep-dev-123.ap-southeast-1.aws.neon.tech/neondb";

/** In-memory `account` table with just provider_id/user_id. */
function fakeDb(rows: { provider: string; user: string }[]) {
  let table = [...rows];
  const legacy = (row: { provider: string }) =>
    ["credential", "google", "github"].includes(row.provider);
  const query: Query = async (text) => {
    if (text.startsWith("delete")) {
      const removed = table.filter(legacy);
      table = table.filter((row) => !legacy(row));
      return removed.map(() => ({ deleted: 1 }));
    }
    if (text.includes("distinct"))
      return [{ count: new Set(table.filter(legacy).map((row) => row.user)).size }];
    const counts = new Map<string, number>();
    for (const row of table.filter(legacy))
      counts.set(row.provider, (counts.get(row.provider) ?? 0) + 1);
    return [...counts].map(([provider_id, count]) => ({ provider_id, count }));
  };
  return { query, rows: () => table };
}

const sample = [
  { provider: "credential", user: "a" },
  { provider: "google", user: "a" },
  { provider: "google", user: "b" },
  { provider: "github", user: "c" },
];

describe("parseCleanupArgs", () => {
  it("defaults to a dry run", () => {
    expect(parseCleanupArgs([])).toEqual({ apply: false });
    expect(parseCleanupArgs(["--apply", "--dry-run"])).toEqual({ apply: false });
    expect(parseCleanupArgs(["--apply"])).toEqual({ apply: true });
  });

  it("rejects unknown flags", () => {
    expect(() => parseCleanupArgs(["--force"])).toThrow("Unknown argument");
  });
});

describe("assertApplyAllowed", () => {
  it("needs the matching host", () => {
    expect(() => assertApplyAllowed(URL_, undefined)).toThrow("CONFIRM_DATABASE_HOST");
    expect(() => assertApplyAllowed(URL_, "other.neon.tech")).toThrow("does not match");
    expect(() => assertApplyAllowed(URL_, "EP-DEV-123.ap-southeast-1.aws.neon.tech")).not.toThrow();
  });

  it("never echoes the URL or host in errors", () => {
    try {
      assertApplyAllowed(URL_, "other.neon.tech");
    } catch (error) {
      expect(String(error)).not.toContain("ep-dev-123");
      expect(String(error)).not.toContain("pw");
    }
  });
});

describe("runLegacyAuthCleanup", () => {
  it("dry run prints counts only and deletes nothing", async () => {
    const db = fakeDb([...sample, { provider: "other", user: "d" }]);
    const lines: string[] = [];
    const result = await runLegacyAuthCleanup({
      args: { apply: false },
      databaseUrl: URL_,
      confirmHost: undefined,
      query: db.query,
      log: (line) => lines.push(line),
    });
    expect(result.before).toEqual({
      total: 4,
      users: 3,
      byProvider: { credential: 1, google: 2, github: 1 },
    });
    expect(result.deleted).toBe(0);
    expect(db.rows()).toHaveLength(5);
    expect(lines.join("\n")).toContain("Dry run: 4 legacy account rows (3 users)");
  });

  it("apply deletes legacy rows once and is idempotent", async () => {
    const db = fakeDb([...sample, { provider: "other", user: "d" }]);
    const run = () =>
      runLegacyAuthCleanup({
        args: { apply: true },
        databaseUrl: URL_,
        confirmHost: "ep-dev-123.ap-southeast-1.aws.neon.tech",
        query: db.query,
        log: () => {},
      });
    expect((await run()).deleted).toBe(4);
    expect(db.rows()).toEqual([{ provider: "other", user: "d" }]);
    expect((await run()).deleted).toBe(0);
  });

  it("apply without confirmation touches nothing", async () => {
    const db = fakeDb(sample);
    await expect(
      runLegacyAuthCleanup({
        args: { apply: true },
        databaseUrl: URL_,
        confirmHost: undefined,
        query: db.query,
        log: () => {},
      }),
    ).rejects.toThrow();
    expect(db.rows()).toHaveLength(4);
  });
});
