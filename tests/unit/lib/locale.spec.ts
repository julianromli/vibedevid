import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import {
  DEFAULT_LOCALE,
  getBrowserInitialLocale,
  getServerLocale,
  isLocale,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  LOCALES,
  readLocaleCookie,
  readSsrLocaleMarker,
  SSR_LOCALE_GLOBAL,
  ssrLocaleScript,
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

describe("readLocaleCookie — cookie only, never navigator", () => {
  const originalCookie = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");

  afterEach(() => {
    if (originalCookie) {
      Object.defineProperty(document, "cookie", originalCookie);
    }
  });

  it("returns en for an en cookie header", () => {
    expect(readLocaleCookie("NEXT_LOCALE=en")).toBe("en");
  });

  it("returns id for an id cookie header", () => {
    expect(readLocaleCookie("NEXT_LOCALE=id; other=1")).toBe("id");
  });

  it("falls back to id for garbage cookie values", () => {
    expect(readLocaleCookie("NEXT_LOCALE=fr")).toBe("id");
  });

  it("falls back to id when the header is missing", () => {
    expect(readLocaleCookie(null)).toBe("id");
    expect(readLocaleCookie("")).toBe("id");
  });

  it("falls back to id when document.cookie throws", () => {
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    expect(readLocaleCookie()).toBe("id");
  });

  it("reads document.cookie when no header is passed", () => {
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get() {
        return "NEXT_LOCALE=en";
      },
    });
    expect(readLocaleCookie()).toBe("en");
  });
});

describe("SSR locale marker — hydration without client beforeLoad", () => {
  const originalCookie = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");

  afterEach(() => {
    window.__VIBEDEV_LOCALE__ = undefined;
    if (originalCookie) {
      Object.defineProperty(document, "cookie", originalCookie);
    }
  });

  it("writes a classic script that sets the window marker", () => {
    expect(ssrLocaleScript("en")).toBe(`window.${SSR_LOCALE_GLOBAL}="en";`);
    expect(ssrLocaleScript("id")).toBe(`window.${SSR_LOCALE_GLOBAL}="id";`);
  });

  it("reads a valid marker from window", () => {
    window.__VIBEDEV_LOCALE__ = "en";
    expect(readSsrLocaleMarker()).toBe("en");
  });

  it("ignores an invalid marker", () => {
    window.__VIBEDEV_LOCALE__ = "fr";
    expect(readSsrLocaleMarker()).toBeUndefined();
  });

  it("prefers the SSR marker over the cookie", () => {
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get() {
        return "NEXT_LOCALE=id";
      },
    });
    window.__VIBEDEV_LOCALE__ = "en";
    expect(getBrowserInitialLocale()).toBe("en");
  });

  it("falls back to the cookie when no marker is set", () => {
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get() {
        return "NEXT_LOCALE=en";
      },
    });
    expect(getBrowserInitialLocale()).toBe("en");
  });
});
