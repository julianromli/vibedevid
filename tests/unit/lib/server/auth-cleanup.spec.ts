import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vite-plus/test";

const deleteExpired = vi.fn(async () => undefined);
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

const { AUTH_CLEANUP_CRON, deleteExpiredAuthRows } = await import("@/lib/server/auth-cleanup");

/** Records which tables were cleaned and the cutoff used. */
function fakeDb() {
  const calls: { table: unknown; where: unknown }[] = [];
  const db = {
    delete: (table: unknown) => ({
      where: async (where: unknown) => {
        calls.push({ table, where });
        return [];
      },
    }),
  };
  return { db, calls };
}

describe("deleteExpiredAuthRows", () => {
  it("deletes expired sessions and verifications", async () => {
    const { authSession, authVerification } = await import("@/lib/db/schema");
    const { db, calls } = fakeDb();
    await deleteExpiredAuthRows(db as never, new Date("2026-11-02T00:00:00Z"));
    expect(calls.map((call) => call.table)).toEqual([authSession, authVerification]);
  });
});

describe("auth cleanup cron", () => {
  it("is registered as a Workers cron trigger", () => {
    const wrangler = readFileSync(path.resolve(__dirname, "../../../../wrangler.jsonc"), "utf8");
    const crons = wrangler.match(/"crons"\s*:\s*\[([^\]]*)\]/)?.[1] ?? "";
    expect(crons).toContain(`"${AUTH_CLEANUP_CRON}"`);
  });

  it("runs the cleanup only for its own schedule", async () => {
    vi.doMock("@/lib/server/auth-cleanup", async (importOriginal) => ({
      ...(await importOriginal<object>()),
      deleteExpiredAuthRows: deleteExpired,
    }));
    const { default: plugin } = await import("@/server/plugins/auth-cleanup-cron");

    type Hook = (event: { controller: { cron: string } }) => Promise<void>;
    let scheduled: Hook | undefined;
    const nitroApp = {
      hooks: {
        hook: (name: string, fn: Hook) => {
          if (name === "cloudflare:scheduled") scheduled = fn;
        },
      },
    };
    plugin(nitroApp as never);

    await scheduled?.({ controller: { cron: "0 0 1 1 *" } });
    expect(deleteExpired).not.toHaveBeenCalled();
    await scheduled?.({ controller: { cron: AUTH_CLEANUP_CRON } });
    expect(deleteExpired).toHaveBeenCalledTimes(1);
  });
});
