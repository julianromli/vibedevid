import { describe, expect, it } from "vite-plus/test";
import { parseEnvFile } from "@/scripts/seed/env";
import { assertSafeSeedTarget, isProductionSiteUrl } from "@/scripts/seed/guards";

describe("isProductionSiteUrl", () => {
  it("treats the production host as blocked", () => {
    expect(isProductionSiteUrl("https://vibedevid.com")).toBe(true);
    expect(isProductionSiteUrl("https://www.vibedevid.com")).toBe(true);
  });

  it("allows localhost and empty values", () => {
    expect(isProductionSiteUrl("http://localhost:3000")).toBe(false);
    expect(isProductionSiteUrl(undefined)).toBe(false);
    expect(isProductionSiteUrl("")).toBe(false);
  });
});

describe("assertSafeSeedTarget", () => {
  it("throws when a site URL is production and allowProduction is false", () => {
    expect(() =>
      assertSafeSeedTarget({
        siteUrls: ["http://localhost:3000", "https://vibedevid.com"],
        allowProduction: false,
      }),
    ).toThrow(/Refusing to seed/);
  });

  it("allows production when SEED_ALLOW_PRODUCTION is set", () => {
    expect(() =>
      assertSafeSeedTarget({
        siteUrls: ["https://vibedevid.com"],
        allowProduction: true,
      }),
    ).not.toThrow();
  });
});

describe("parseEnvFile", () => {
  it("reads keys and strips quotes", () => {
    const parsed = parseEnvFile(`# comment\nFOO=bar\nBAZ="quoted"\n`);
    expect(parsed).toEqual({ FOO: "bar", BAZ: "quoted" });
  });
});
