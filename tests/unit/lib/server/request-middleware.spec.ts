import { describe, expect, it, vi } from "vite-plus/test";

vi.mock("@/lib/auth/server", () => ({ getAuth: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

const { shouldSkipRequestMiddleware } = await import("@/lib/server/request-middleware");

describe("shouldSkipRequestMiddleware", () => {
  it("leaves Better Auth responses alone so the session cookie survives", () => {
    expect(shouldSkipRequestMiddleware("/api/auth/sign-in/email-otp")).toBe(true);
    expect(shouldSkipRequestMiddleware("/api/auth/get-session")).toBe(true);
  });

  it("still runs for pages and other API routes", () => {
    expect(shouldSkipRequestMiddleware("/")).toBe(false);
    expect(shouldSkipRequestMiddleware("/user/onboarding")).toBe(false);
    expect(shouldSkipRequestMiddleware("/api/auth-check")).toBe(false);
  });

  it("skips static assets", () => {
    expect(shouldSkipRequestMiddleware("/assets/app.js")).toBe(true);
    expect(shouldSkipRequestMiddleware("/favicon.ico")).toBe(true);
  });
});
