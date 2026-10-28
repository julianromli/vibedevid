import { describe, expect, it, vi } from "vite-plus/test";
import { guardOtpRequest } from "@/lib/auth/otp-request-guard";

const allow = vi.fn(async () => ({ allowed: true, retryAfterSeconds: 0 }));
const deny = async () => ({ allowed: false, retryAfterSeconds: 37 });

function send(email: string, overrides: Partial<Parameters<typeof guardOtpRequest>[0]> = {}) {
  return guardOtpRequest({
    path: "/email-otp/send-verification-otp",
    body: { email, type: "sign-in" },
    ip: "1.1.1.1",
    emailConfigured: true,
    userExists: async () => false,
    consume: allow,
    ...overrides,
  });
}

describe("guardOtpRequest on send", () => {
  it("allows a new Gmail address", async () => {
    await expect(send("new@gmail.com")).resolves.toBeNull();
  });

  it("blocks a new account on a domain outside the allowlist", async () => {
    await expect(send("new@company.co")).resolves.toMatchObject({
      status: "BAD_REQUEST",
      code: "EMAIL_DOMAIN_NOT_ALLOWED",
      domain: "company.co",
    });
  });

  it("lets an exact allowed address on another domain get a code", async () => {
    const allowedEmails = new Set(["faiz@mail.grokbot.com"]);
    await expect(send("faiz@mail.grokbot.com", { allowedEmails })).resolves.toBeNull();
    await expect(send("qa@mail.grokbot.com", { allowedEmails })).resolves.toMatchObject({
      code: "EMAIL_DOMAIN_NOT_ALLOWED",
    });
  });

  it("lets an existing user on any domain get a code", async () => {
    await expect(send("old@company.co", { userExists: async () => true })).resolves.toBeNull();
  });

  it("refuses to pretend to send when email delivery is missing", async () => {
    await expect(send("new@gmail.com", { emailConfigured: false })).resolves.toMatchObject({
      status: "SERVICE_UNAVAILABLE",
      code: "EMAIL_NOT_CONFIGURED",
    });
  });

  it("only issues sign-in codes", async () => {
    await expect(
      send("new@gmail.com", { body: { email: "new@gmail.com", type: "forget-password" } }),
    ).resolves.toMatchObject({ code: "OTP_TYPE_NOT_ALLOWED" });
  });

  it("returns the cooldown when the rate limit blocks", async () => {
    await expect(send("new@gmail.com", { consume: deny })).resolves.toMatchObject({
      status: "TOO_MANY_REQUESTS",
      code: "OTP_RESEND_COOLDOWN",
      retryAfterSeconds: 37,
    });
  });
});

describe("guardOtpRequest on sign-in", () => {
  it("caps code checks per IP", async () => {
    const input = {
      path: "/sign-in/email-otp",
      body: { email: "a@gmail.com", otp: "123456" },
      ip: "1.1.1.1",
      emailConfigured: true,
      userExists: async () => true,
    };
    await expect(guardOtpRequest({ ...input, consume: allow })).resolves.toBeNull();
    await expect(guardOtpRequest({ ...input, consume: deny })).resolves.toMatchObject({
      code: "OTP_VERIFY_LIMIT",
    });
  });

  it("ignores other auth paths", async () => {
    await expect(
      guardOtpRequest({
        path: "/get-session",
        body: undefined,
        ip: "1.1.1.1",
        emailConfigured: false,
        userExists: async () => false,
        consume: deny,
      }),
    ).resolves.toBeNull();
  });
});
