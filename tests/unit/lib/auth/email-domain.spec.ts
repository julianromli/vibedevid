import { describe, expect, it } from "vite-plus/test";
import { getEmailDomain, newAccountEmailError } from "@/lib/auth/email-domain";

describe("email domain allowlist", () => {
  it("reads the lowercased domain", () => {
    expect(getEmailDomain("Someone@GMAIL.com ")).toBe("gmail.com");
    expect(getEmailDomain("no-at-sign")).toBeNull();
  });

  it.each([
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "yahoo.co.id",
    "outlook.com",
    "outlook.co.id",
    "hotmail.com",
    "live.com",
  ])("lets a new account use %s", (domain) => {
    expect(newAccountEmailError(`new@${domain}`, { existingUser: false })).toBeNull();
  });

  it("blocks a new account on another domain", () => {
    expect(newAccountEmailError("new@company.co", { existingUser: false })).toEqual({
      code: "EMAIL_DOMAIN_NOT_ALLOWED",
      domain: "company.co",
    });
  });

  it("lets an existing user on another domain sign in", () => {
    expect(newAccountEmailError("old@company.co", { existingUser: true })).toBeNull();
  });

  it("rejects an address without a domain", () => {
    expect(newAccountEmailError("broken@", { existingUser: false })).toEqual({
      code: "INVALID_EMAIL",
      domain: null,
    });
  });
});
