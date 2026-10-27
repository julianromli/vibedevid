import { describe, expect, it } from "vite-plus/test";
import {
  availabilityReason,
  suggestUsername,
  usernameCandidates,
  validateUsername,
} from "@/lib/username";

describe("validateUsername", () => {
  it("accepts 3 to 30 lowercase letters, digits and underscores", () => {
    expect(validateUsername("abc")).toEqual({ ok: true, username: "abc" });
    expect(validateUsername("vibe_dev_2026")).toEqual({ ok: true, username: "vibe_dev_2026" });
    expect(validateUsername("a".repeat(30))).toEqual({ ok: true, username: "a".repeat(30) });
  });

  it("trims and lowercases input", () => {
    expect(validateUsername("  FaizDev ")).toEqual({ ok: true, username: "faizdev" });
  });

  it.each([
    ["", "required"],
    ["ab", "too_short"],
    ["a".repeat(31), "too_long"],
    ["faiz.dev", "invalid_chars"],
    ["faiz-dev", "invalid_chars"],
    ["faiz dev", "invalid_chars"],
    ["ñame", "invalid_chars"],
    ["admin", "reserved"],
    ["Dashboard", "reserved"],
    ["user", "reserved"],
  ])("rejects %j as %s", (input, error) => {
    expect(validateUsername(input)).toEqual({ ok: false, error });
  });
});

describe("suggestUsername", () => {
  it("builds a valid name from the email local part", () => {
    expect(suggestUsername("Faiz.Intifada@gmail.com")).toBe("faiz_intifada");
    expect(suggestUsername("ab@gmail.com")).toBe("ab_dev");
    expect(suggestUsername("admin@gmail.com")).toBe("admin_dev");
    expect(suggestUsername(`${"x".repeat(40)}@gmail.com`)).toBe("x".repeat(30));
  });

  it("returns a valid name for odd input", () => {
    const value = suggestUsername("...@gmail.com");
    expect(validateUsername(value).ok).toBe(true);
  });
});

describe("usernameCandidates", () => {
  const seed = () => 0.5; // digits = 550

  it("returns valid, distinct alternatives", () => {
    const names = usernameCandidates("faiz", seed);
    expect(names[0]).toBe("faiz_dev");
    expect(names).toContain("faiz550");
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(validateUsername(name).ok).toBe(true);
  });

  it("stays within 30 characters", () => {
    for (const name of usernameCandidates("a".repeat(30), seed))
      expect(name.length).toBeLessThanOrEqual(30);
  });

  it("turns a reserved name into a claimable one", () => {
    expect(usernameCandidates("support", seed)[0]).toBe("support_dev");
  });
});

describe("availabilityReason", () => {
  it("maps validation errors to API reasons", () => {
    expect(availabilityReason("reserved")).toBe("reserved");
    expect(availabilityReason("too_short")).toBe("invalid");
    expect(availabilityReason("invalid_chars")).toBe("invalid");
  });
});

describe("validateUsername with system names", () => {
  it("rejects reserved system names", () => {
    for (const name of ["support", "Moderator", "signup", "vibedevid"]) {
      expect(validateUsername(name)).toEqual({ ok: false, error: "reserved" });
    }
  });
});
