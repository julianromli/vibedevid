import { describe, expect, it, vi } from "vite-plus/test";

vi.mock("better-auth", () => ({ betterAuth: (options: unknown) => ({ options }) }));
vi.mock("better-auth/adapters/drizzle", () => ({ drizzleAdapter: () => ({}) }));
vi.mock("@/lib/db", () => ({ getDb: () => ({}) }));

const { createAuth } = await import("@/lib/auth/server");

type CapturedOptions = {
  session?: { cookieCache?: { enabled?: boolean; maxAge?: number } };
};

describe("Better Auth session", () => {
  it("caches the session in a signed cookie for five minutes", () => {
    const { options } = createAuth() as unknown as { options: CapturedOptions };
    expect(options.session?.cookieCache).toMatchObject({ enabled: true, maxAge: 5 * 60 });
  });
});
