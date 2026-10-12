import { CANONICAL_SITE_HOST, CANONICAL_SITE_ORIGIN, SITE_HOST_ALIASES } from "@/lib/seo/site-url";

const DEV_SITE_ORIGIN = "http://localhost:3000";

/**
 * Host patterns Better Auth may use as the request base URL.
 * Loopback patterns stay off the production list so a browser page on
 * localhost cannot pass the production origin check.
 */
const DEV_LOOPBACK_HOSTS = ["localhost", "localhost:*", "127.0.0.1", "127.0.0.1:*"] as const;

export interface AuthBaseURLConfig {
  allowedHosts: string[];
  protocol: "auto" | "https";
  fallback: string;
}

function readNodeEnv(): string | undefined {
  if (typeof process === "undefined") return undefined;
  const value = process.env?.NODE_ENV;
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function isProductionAuthRuntime(): boolean {
  const nodeEnv = readNodeEnv();
  if (nodeEnv === "production") return true;
  if (nodeEnv === "development" || nodeEnv === "test") return false;

  try {
    if (import.meta.env?.DEV === true) return false;
    if (import.meta.env?.PROD === true) return true;
  } catch {
    // import.meta is absent in some runtimes.
  }

  return true;
}

function isLoopbackAuthHost(hostname: string): boolean {
  const host = hostname
    .trim()
    .toLowerCase()
    .replace(/\.+$/, "")
    .replace(/^\[|\]$/g, "");
  return (
    host === "localhost" || host.endsWith(".localhost") || host === "::1" || host.startsWith("127.")
  );
}

function isKnownSiteHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.+$/, "");
  return host === CANONICAL_SITE_HOST || SITE_HOST_ALIASES.has(host);
}

function parseHttpUrl(value: string | undefined): URL | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * Fallback used when the request host is missing or not allowed.
 * A production secret that still says localhost must not become the fallback.
 */
export function resolveAuthFallback(configuredUrl: string, production: boolean): string {
  const url = parseHttpUrl(configuredUrl);
  if (!url) return production ? CANONICAL_SITE_ORIGIN : DEV_SITE_ORIGIN;
  if (production && isLoopbackAuthHost(url.hostname)) return CANONICAL_SITE_ORIGIN;
  return url.origin;
}

export function buildAuthBaseURLConfig(
  configuredUrl: string,
  production = isProductionAuthRuntime(),
): AuthBaseURLConfig {
  const allowedHosts = [CANONICAL_SITE_HOST, ...SITE_HOST_ALIASES];

  if (!production) {
    allowedHosts.push(...DEV_LOOPBACK_HOSTS);
  }

  const configured = parseHttpUrl(configuredUrl);
  if (configured) {
    const host = configured.hostname.toLowerCase().replace(/\.+$/, "");
    const loopback = isLoopbackAuthHost(host);
    const alreadyListed = isKnownSiteHost(host) || (!production && loopback);
    if (!alreadyListed && !(production && loopback)) {
      allowedHosts.push(host);
    }
  }

  return {
    allowedHosts,
    // Production sign-in is HTTPS only. Development keeps http for localhost.
    protocol: production ? "https" : "auto",
    fallback: resolveAuthFallback(configuredUrl, production),
  };
}

/**
 * Browser auth calls must stay on the page origin.
 * A baked VITE_BETTER_AUTH_URL from another host makes Better Auth return
 * "Invalid origin" and drops the session cookie.
 */
export function resolveAuthClientBaseUrl(input: {
  pageOrigin?: string;
  configuredUrls: Array<string | undefined>;
}): string {
  const page = parseHttpUrl(input.pageOrigin);
  if (page && (isKnownSiteHost(page.hostname) || isLoopbackAuthHost(page.hostname))) {
    return page.origin;
  }

  for (const candidate of input.configuredUrls) {
    const url = parseHttpUrl(candidate);
    if (url) return url.origin;
  }

  return "";
}
