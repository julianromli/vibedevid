import { describe, expect, it, vi } from "vite-plus/test";

vi.mock("@/lib/actions/onboarding.functions", () => ({
  checkUsernameAvailabilityFn: vi.fn(),
  claimUsernameFn: vi.fn(),
}));

const { planUsernameCheck } = await import("@/hooks/use-username-claim");

describe("planUsernameCheck", () => {
  it("sends reserved names to the server so suggestions come back, like taken ones", () => {
    expect(planUsernameCheck("admin", true)).toEqual({ kind: "remote", username: "admin" });
    expect(planUsernameCheck("Admin", false)).toEqual({ kind: "remote", username: "admin" });
  });

  it("checks valid names on the server", () => {
    expect(planUsernameCheck("faiz_dev", false)).toEqual({ kind: "remote", username: "faiz_dev" });
  });

  it("answers format errors locally, hidden until errors are revealed", () => {
    expect(planUsernameCheck("ab", false)).toEqual({ kind: "local", state: { kind: "hint" } });
    expect(planUsernameCheck("ab", true)).toEqual({
      kind: "local",
      state: { kind: "invalid", error: "too_short" },
    });
    expect(planUsernameCheck("bad name", true)).toEqual({
      kind: "local",
      state: { kind: "invalid", error: "invalid_chars" },
    });
  });
});
