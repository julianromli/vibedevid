import { betterAuth } from "better-auth";
import { describe, expect, it } from "vite-plus/test";
import {
  buildAuthBaseURLConfig,
  resolveAuthClientBaseUrl,
  resolveAuthFallback,
} from "@/lib/auth/origins";
import { CANONICAL_SITE_ORIGIN } from "@/lib/seo/site-url";

const AUTH_SECRET = "0123456789abcdef0123456789abcdef";

async function signInStatus(
  origin: string,
  host: string,
  production: boolean,
  configuredUrl: string,
) {
  const auth = betterAuth({
    baseURL: buildAuthBaseURLConfig(configuredUrl, production),
    secret: AUTH_SECRET,
    emailAndPassword: { enabled: true },
    advanced: { trustedProxyHeaders: false, disableOriginCheck: false },
  });

  const response = await auth.handler(
    new Request(`https://${host}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        origin,
        host,
        cookie: "NEXT_LOCALE=id",
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: "a@gmail.com", password: "password123" }),
    }),
  );

  return response.status;
}

describe("buildAuthBaseURLConfig", () => {
  it("trusts the production hosts when the secret is still localhost", () => {
    const config = buildAuthBaseURLConfig("http://localhost:3000", true);

    expect(config.fallback).toBe(CANONICAL_SITE_ORIGIN);
    expect(config.protocol).toBe("https");
    expect(config.allowedHosts).toEqual([
      "vibedeveloper.id",
      "www.vibedeveloper.id",
      "vibedevid.com",
      "www.vibedevid.com",
    ]);
  });

  it("keeps an operator staging host and drops a trailing slash", () => {
    const config = buildAuthBaseURLConfig("https://staging.example.com/", true);

    expect(config.fallback).toBe("https://staging.example.com");
    expect(config.allowedHosts).toContain("staging.example.com");
    expect(config.allowedHosts).toContain("vibedeveloper.id");
  });

  it("allows localhost only outside production", () => {
    const config = buildAuthBaseURLConfig("", false);

    expect(config.protocol).toBe("auto");
    expect(config.fallback).toBe("http://localhost:3000");
    expect(config.allowedHosts).toContain("localhost:*");
    expect(config.allowedHosts).toContain("vibedeveloper.id");
  });

  it("uses a dev configured origin as the fallback", () => {
    expect(resolveAuthFallback("http://127.0.0.1:3000/", false)).toBe("http://127.0.0.1:3000");
  });
});

describe("resolveAuthClientBaseUrl", () => {
  it("posts to the page origin when the host is a known site", () => {
    expect(
      resolveAuthClientBaseUrl({
        pageOrigin: "https://vibedeveloper.id",
        configuredUrls: ["http://localhost:3000"],
      }),
    ).toBe("https://vibedeveloper.id");
  });

  it("posts to www and the legacy host instead of a stale auth URL", () => {
    expect(
      resolveAuthClientBaseUrl({
        pageOrigin: "https://www.vibedevid.com/user/auth",
        configuredUrls: ["https://vibedeveloper.id"],
      }),
    ).toBe("https://www.vibedevid.com");
  });

  it("ignores an unknown page origin", () => {
    expect(
      resolveAuthClientBaseUrl({
        pageOrigin: "https://evil.example",
        configuredUrls: ["https://vibedeveloper.id/"],
      }),
    ).toBe("https://vibedeveloper.id");
  });

  it("uses localhost when the page is local", () => {
    expect(
      resolveAuthClientBaseUrl({
        pageOrigin: "http://localhost:3000",
        configuredUrls: ["https://vibedeveloper.id"],
      }),
    ).toBe("http://localhost:3000");
  });
});

describe("sign-in origin check", () => {
  it("accepts the production site when BETTER_AUTH_URL is still localhost", async () => {
    await expect(
      signInStatus("https://vibedeveloper.id", "vibedeveloper.id", true, "http://localhost:3000"),
    ).resolves.toBe(401);
  });

  it("rejects an unknown origin", async () => {
    await expect(
      signInStatus("https://evil.example", "vibedeveloper.id", true, CANONICAL_SITE_ORIGIN),
    ).resolves.toBe(403);
  });

  it("accepts localhost only outside production", async () => {
    await expect(
      signInStatus("http://localhost:3000", "localhost:3000", false, "http://localhost:3000"),
    ).resolves.toBe(401);
    await expect(
      signInStatus("http://localhost:3000", "localhost:3000", true, "http://localhost:3000"),
    ).resolves.toBe(403);
  });
});
