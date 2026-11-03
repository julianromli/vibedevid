import { describe, expect, it, vi } from "vite-plus/test";

const requestState = vi.hoisted(() => ({ current: undefined as Request | undefined }));

vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () => {
    if (!requestState.current) throw new Error("No StartEvent found in AsyncLocalStorage");
    return requestState.current;
  },
}));

const getDb = vi.fn(() => ({}));
vi.mock("@/lib/db", () => ({ getDb }));
vi.mock("better-auth", () => ({ betterAuth: vi.fn(() => ({ api: {} })) }));
vi.mock("better-auth/adapters/drizzle", () => ({ drizzleAdapter: vi.fn(() => ({})) }));

const { getAuth } = await import("@/lib/auth/server");

describe("getAuth", () => {
  it("builds one Better Auth instance per request, on that request's db client", () => {
    requestState.current = new Request("https://vibedeveloper.id/a");
    const first = getAuth();
    expect(getAuth()).toBe(first);
    expect(getDb).toHaveBeenCalledTimes(1);

    requestState.current = new Request("https://vibedeveloper.id/b");
    expect(getAuth()).not.toBe(first);
    expect(getDb).toHaveBeenCalledTimes(2);
  });

  it("builds a fresh instance outside a request", () => {
    requestState.current = undefined;
    expect(getAuth()).not.toBe(getAuth());
  });
});
