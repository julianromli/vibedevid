import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import {
  DEFAULT_LOCALE,
  getServerLocale,
  isLocale,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  LOCALES,
} from "@/lib/locale";

/**
 * Contract tests for the locale owner module. These lock the seam that
 * previously drifted between two near-identical getServerLocale copies.
 */

const h = vi.hoisted(() => ({
  storedCookie: undefined as string | undefined,
  getCookie: vi.fn(() => h.storedCookie),
}));

vi.mock("@tanstack/react-start/server", () => ({
  getCookie: h.getCookie,
}));

beforeEach(() => {
  h.storedCookie = undefined;
  h.getCookie.mockClear();
});

describe("locale registry — the single source both server and i18n use", () => {
  it("contains id and en in canonical order", () => {
    expect([...LOCALES]).toEqual(["id", "en"]);
    expect(DEFAULT_LOCALE).toBe("id");
  });

  it("owns the cookie contract constants", () => {
    expect(LOCALE_COOKIE_NAME).toBe("NEXT_LOCALE");
    expect(LOCALE_COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 365);
  });

  it("recognizes registered locales and rejects everything else", () => {
    expect(isLocale("id")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale("ID")).toBe(false); // case-sensitive registry
  });
});

describe("getServerLocale — the one reader every route consumes", () => {
  it("returns en for an en cookie", async () => {
    h.storedCookie = "en";
    await expect(getServerLocale()).resolves.toBe("en");
  });

  it("returns id for an id cookie", async () => {
    h.storedCookie = "id";
    await expect(getServerLocale()).resolves.toBe("id");
  });

  it("falls back to the default locale for garbage cookie values", async () => {
    h.storedCookie = "not-a-locale";
    await expect(getServerLocale()).resolves.toBe("id");
  });

  it("falls back to the default locale when no cookie is set", async () => {
    h.storedCookie = undefined;
    await expect(getServerLocale()).resolves.toBe("id");
  });
});
