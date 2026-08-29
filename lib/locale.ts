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
