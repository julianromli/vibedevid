/**
 * Locale — the single owner of the site's locale registry and locale cookie
 * contract.
 *
 * Importable from browser and server code alike (no side effects, no
 * `@/i18n` import — `i18n/index.ts` builds its routing config FROM this
 * module, never the reverse, to avoid a circular import).
 */

export const LOCALES = ["id", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "id";

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: string | null | undefined): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

function readDocumentCookie(): string {
  if (typeof document === "undefined") {
    return "";
  }
  try {
    return document.cookie;
  } catch {
    return "";
  }
}

function parseCookieValue(cookieHeader: string, name: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator);
    if (key !== name) {
      continue;
    }
    const raw = trimmed.slice(separator + 1);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return undefined;
}

/**
 * Read the locale cookie without touching `navigator`. In-app browsers often
 * delay or block cookies; a missing or unreadable cookie must fall back to
 * the default locale so SSR HTML and the first client render stay in sync.
 *
 * Pass `cookieHeader` to parse a Cookie request header. Omit it to read
 * `document.cookie` (empty string when `document` is missing or throws).
 */
export function readLocaleCookie(cookieHeader?: string | null): Locale {
  const source = cookieHeader ?? readDocumentCookie();
  const value = parseCookieValue(source, LOCALE_COOKIE_NAME);
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Read the server-side locale cookie, falling back to the default locale.
 *
 * The cookie helper is imported lazily so `@tanstack/react-start/server` (and
 * its Node-only / `react-dom/server` dependencies) never reach the client
 * bundle. Callers in the client route graph would otherwise break hydration.
 */
export async function getServerLocale(): Promise<Locale> {
  const { getCookie } = await import("@tanstack/react-start/server");
  const cookieLocale = getCookie(LOCALE_COOKIE_NAME);
  return isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
}
