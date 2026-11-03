import { describe, expect, it, vi } from "vite-plus/test";

vi.mock("@/lib/auth/server", () => ({ getAuth: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

const { getAuth } = await import("@/lib/auth/server");
const { applyAuthMiddleware, shouldSkipRequestMiddleware } =
  await import("@/lib/server/request-middleware");

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

describe("applyAuthMiddleware", () => {
  const getSession = vi.fn(async () => null);
  vi.mocked(getAuth).mockReturnValue({ api: { getSession } } as never);
  const request = (path: string) => new Request(`https://vibedeveloper.id${path}`);

  it("skips the session lookup for server functions and API routes", async () => {
    getSession.mockClear();
    await applyAuthMiddleware(request("/_serverFn/abc"), "/_serverFn/abc", []);
    await applyAuthMiddleware(request("/api/uploadthing"), "/api/uploadthing", []);
    expect(getSession).not.toHaveBeenCalled();
  });

  it("still resolves the session for pages", async () => {
    getSession.mockClear();
    await applyAuthMiddleware(request("/project/list"), "/project/list", []);
    expect(getSession).toHaveBeenCalledTimes(1);
  });
});
