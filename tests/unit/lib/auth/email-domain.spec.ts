import { describe, expect, it } from "vite-plus/test";
import { getEmailDomain, newAccountEmailError, parseAllowedEmails } from "@/lib/auth/email-domain";

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

  it("lets one exact address outside the domain list create an account", () => {
    const allowedEmails = parseAllowedEmails("faiz@mail.grokbot.com");
    expect(
      newAccountEmailError(" Faiz@Mail.Grokbot.com", { existingUser: false, allowedEmails }),
    ).toBeNull();
  });

  it("does not open the whole domain of an allowed address", () => {
    const allowedEmails = parseAllowedEmails("faiz@mail.grokbot.com");
    expect(
      newAccountEmailError("other@mail.grokbot.com", { existingUser: false, allowedEmails }),
    ).toEqual({ code: "EMAIL_DOMAIN_NOT_ALLOWED", domain: "mail.grokbot.com" });
  });
});

describe("parseAllowedEmails", () => {
  it("reads a comma-separated list, trimmed and lowercased", () => {
    expect([...parseAllowedEmails(" A@x.io, b@Y.io ,,")]).toEqual(["a@x.io", "b@y.io"]);
  });

  it("is empty when unset or when an entry is not an address", () => {
    expect(parseAllowedEmails(undefined).size).toBe(0);
    expect([...parseAllowedEmails("mail.grokbot.com,@x.io,ok@x.io")]).toEqual(["ok@x.io"]);
  });
});
