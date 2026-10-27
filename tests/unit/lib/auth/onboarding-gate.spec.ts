import { describe, expect, it } from "vite-plus/test";
import { resolveOnboardingRedirect } from "@/lib/auth/onboarding-gate";

const base = { method: "GET", search: "", hasSession: true, usernameClaimed: false };

describe("onboarding gate", () => {
  it("sends an unclaimed user to onboarding and keeps the page they wanted", () => {
    expect(
      resolveOnboardingRedirect({ ...base, pathname: "/project/list", search: "?page=2" }),
    ).toBe("/user/onboarding?redirectTo=%2Fproject%2Flist%3Fpage%3D2");
    expect(resolveOnboardingRedirect({ ...base, pathname: "/" })).toBe("/user/onboarding");
  });

  it.each([
    "/user/auth",
    "/api/auth/sign-out",
    "/api/auth-check",
    "/_serverFn/abc",
    "/terms-of-service",
    "/privacy-policy",
  ])("leaves %s alone", (pathname) => {
    expect(resolveOnboardingRedirect({ ...base, pathname })).toBeNull();
  });

  it("does not touch non-GET requests", () => {
    expect(
      resolveOnboardingRedirect({ ...base, method: "POST", pathname: "/project/list" }),
    ).toBeNull();
  });

  it("does nothing for claimed users or guests on normal pages", () => {
    expect(
      resolveOnboardingRedirect({ ...base, usernameClaimed: true, pathname: "/blog" }),
    ).toBeNull();
    expect(resolveOnboardingRedirect({ ...base, hasSession: false, pathname: "/blog" })).toBeNull();
  });

  it("keeps an unclaimed user on the onboarding page", () => {
    expect(resolveOnboardingRedirect({ ...base, pathname: "/user/onboarding" })).toBeNull();
  });

  it("sends a guest on onboarding to sign in", () => {
    expect(
      resolveOnboardingRedirect({ ...base, hasSession: false, pathname: "/user/onboarding" }),
    ).toBe("/user/auth");
  });

  it("sends a claimed user on onboarding to a safe redirect target", () => {
    expect(
      resolveOnboardingRedirect({
        ...base,
        usernameClaimed: true,
        pathname: "/user/onboarding",
        search: "?redirectTo=%2Fblog",
      }),
    ).toBe("/blog");
    expect(
      resolveOnboardingRedirect({
        ...base,
        usernameClaimed: true,
        pathname: "/user/onboarding",
        search: "?redirectTo=https%3A%2F%2Fevil.example",
      }),
    ).toBe("/");
    expect(
      resolveOnboardingRedirect({
        ...base,
        usernameClaimed: true,
        pathname: "/user/onboarding",
        search: "?redirectTo=%2Fuser%2Fonboarding",
      }),
    ).toBe("/");
  });
});
