import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const requestState = vi.hoisted(() => ({ current: undefined as Request | undefined }));

vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () => {
    if (!requestState.current) throw new Error("No StartEvent found in AsyncLocalStorage");
    return requestState.current;
  },
}));

vi.mock("postgres", async (importOriginal) => {
  const actual = await importOriginal<{ default: typeof import("postgres") }>();
  // Real postgres.js clients. None of these tests run a query, so no socket opens.
  return { default: vi.fn((url: string, options: object) => actual.default(url, options)) };
});

const postgres = (await import("postgres")).default as unknown as ReturnType<typeof vi.fn>;
const { createDb, getDb, resolveDatabaseUrl } = await import("@/lib/db");

const HYPERDRIVE_URL = "postgres://hd-user:hd-pass@hyperdrive.local:5432/vibedevid";
const FALLBACK_URL = "postgres://local:local@localhost:5432/vibedevid";

function setEnv(env: Record<string, unknown> | undefined) {
  (globalThis as { __env__?: unknown }).__env__ = env;
}

describe("database client", () => {
  beforeEach(() => {
    postgres.mockClear();
    requestState.current = undefined;
    setEnv({ HYPERDRIVE: { connectionString: HYPERDRIVE_URL } });
    vi.stubEnv("DATABASE_URL", FALLBACK_URL);
  });

  afterEach(() => {
    setEnv(undefined);
    vi.unstubAllEnvs();
  });

  it("connects through the Hyperdrive binding when it is bound", () => {
    expect(resolveDatabaseUrl()).toBe(HYPERDRIVE_URL);
    createDb();
    expect(postgres).toHaveBeenCalledWith(HYPERDRIVE_URL, expect.objectContaining({ max: 5 }));
  });

  it("falls back to DATABASE_URL without a binding (local dev, scripts)", () => {
    setEnv(undefined);
    expect(resolveDatabaseUrl()).toBe(FALLBACK_URL);
  });

  it("fails loudly when neither is configured", () => {
    setEnv(undefined);
    vi.stubEnv("DATABASE_URL", "");
    expect(() => resolveDatabaseUrl()).toThrow(/HYPERDRIVE|DATABASE_URL/);
  });

  it("reuses one client within a request", () => {
    requestState.current = new Request("https://vibedeveloper.id/");
    expect(getDb()).toBe(getDb());
    expect(postgres).toHaveBeenCalledTimes(1);
  });

  it("never shares a client between requests", () => {
    requestState.current = new Request("https://vibedeveloper.id/a");
    const first = getDb();
    requestState.current = new Request("https://vibedeveloper.id/b");
    const second = getDb();
    expect(second).not.toBe(first);
    expect(postgres).toHaveBeenCalledTimes(2);
  });

  it("creates a fresh client outside a request (cron) from the binding", () => {
    const first = getDb();
    const second = getDb();
    expect(second).not.toBe(first);
    expect(postgres).toHaveBeenNthCalledWith(1, HYPERDRIVE_URL, expect.anything());
    expect(postgres).toHaveBeenCalledTimes(2);
  });
});
