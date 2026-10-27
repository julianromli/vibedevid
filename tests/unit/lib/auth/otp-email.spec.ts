import { describe, expect, it } from "vite-plus/test";
import { buildOtpEmail, resolveEmailLocale } from "@/lib/auth/otp-email";

describe("resolveEmailLocale", () => {
  it("uses the NEXT_LOCALE cookie", () => {
    expect(resolveEmailLocale(new Headers({ cookie: "a=1; NEXT_LOCALE=en" }))).toBe("en");
    expect(resolveEmailLocale(new Headers({ cookie: "NEXT_LOCALE=id" }))).toBe("id");
  });

  it("falls back to Accept-Language, then Indonesian", () => {
    expect(resolveEmailLocale(new Headers({ "accept-language": "en-US,en;q=0.9" }))).toBe("en");
    expect(resolveEmailLocale(new Headers({ cookie: "NEXT_LOCALE=fr" }))).toBe("id");
    expect(resolveEmailLocale(undefined)).toBe("id");
  });
});

describe("buildOtpEmail", () => {
  const base = { otp: "482917", email: "someone@gmail.com", expiresInMinutes: 10 };

  it("keeps the code out of the subject (lock-screen previews)", () => {
    for (const locale of ["id", "en"] as const) {
      const email = buildOtpEmail({ ...base, locale });
      expect(email.subject).not.toContain("482917");
      expect(email.html).toContain("482917");
      expect(email.text).toContain("482917");
    }
  });

  it("writes Indonesian copy", () => {
    const email = buildOtpEmail({ ...base, locale: "id" });
    expect(email.subject).toBe("Kode masuk VibeDev ID kamu");
    expect(email.text).toContain("10 menit");
    expect(email.html).toContain('lang="id"');
  });

  it("writes English copy", () => {
    const email = buildOtpEmail({ ...base, locale: "en" });
    expect(email.subject).toBe("Your VibeDev ID sign-in code");
    expect(email.text).toContain("10 minutes");
  });

  it("uses a text wordmark, not a hosted image", () => {
    expect(buildOtpEmail({ ...base, locale: "en" }).html).not.toMatch(/<img\b/i);
  });

  it("escapes values in HTML", () => {
    const email = buildOtpEmail({ ...base, email: "<x>@gmail.com", otp: "<b>1</b>", locale: "en" });
    expect(email.html).not.toContain("<b>1</b>");
    expect(email.html).not.toContain("<x>@gmail.com");
  });
});
