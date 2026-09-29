/**
 * Utility functions for fetching website favicons
 */

const DEFAULT_FAVICON = "/default-favicon.svg";

const BLOCKED_HOST_NAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google.com",
  "metadata.goog",
]);

function parseIpv4Octet(part: string): number | null {
  if (!/^\d+$/.test(part)) return null;
  const value = part.length > 1 && part.startsWith("0") ? Number.parseInt(part, 8) : Number(part);
  if (!Number.isInteger(value) || value < 0 || value > 255) return null;
  return value;
}

function isBlockedIpv4(first: number, second: number): boolean {
  if (first === 0 || first === 10 || first === 127) return true;
  if (first === 169 && second === 254) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  if (first === 192 && second === 168) return true;
  if (first === 100 && second >= 64 && second <= 127) return true;
  if (first >= 224) return true;
  return false;
}

function isBlockedIpv4Literal(host: string): boolean {
  if (/^\d+$/.test(host)) {
    const value = Number(host);
    if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) return true;
    return isBlockedIpv4((value >>> 24) & 255, (value >>> 16) & 255);
  }

  const parts = host.split(".");
  if (parts.length !== 4) return false;
  const octets = parts.map(parseIpv4Octet);
  if (octets.some((octet) => octet == null)) return true;
  return isBlockedIpv4(octets[0] as number, octets[1] as number);
}

function isBlockedIpv6(host: string): boolean {
  if (!host.includes(":")) return false;
  if (host === "::" || host === "::1" || host === "0:0:0:0:0:0:0:1") return true;
  if (host.startsWith("fc") || host.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(host)) return true;
  if (host.startsWith("::ffff:")) return isBlockedHostname(host.slice("::ffff:".length));
  return false;
}

/**
 * Reject private, loopback, link-local, and metadata hosts before any outbound fetch.
 * Numeric tricks (decimal, octal, IPv4-mapped IPv6) are blocked. DNS rebinding is
 * not resolved here: this module is also imported by the browser, and Workers
 * do not offer a stable resolver.
 */
export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/^\[|\]$/g, "");
  if (!host) return true;
  if (BLOCKED_HOST_NAMES.has(host)) return true;
  if (host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return true;
  }
  if (isBlockedIpv6(host)) return true;
  if (isBlockedIpv4Literal(host)) return true;
  return false;
}

/**
 * Validate if a string is a proper URL with valid hostname
 * Must have protocol, valid hostname with TLD (e.g., example.com)
 */
function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;

  // Trim and check for empty/whitespace-only strings
  const trimmed = url.trim();
  if (!trimmed || trimmed.length < 4) return false;

  try {
    const urlObj = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);

    // Must have a valid hostname (not empty, not just protocol)
    if (!urlObj.hostname || urlObj.hostname.length < 1) return false;

    // Hostname must contain at least one dot (TLD requirement)
    // This prevents "https" or "http" being treated as valid domains
    if (!urlObj.hostname.includes(".")) return false;

    // Hostname should not be just numbers (invalid domain)
    if (/^\d+$/.test(urlObj.hostname.replace(/\./g, ""))) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Extract domain from URL with strict validation
 */
export function extractDomain(url: string): string | null {
  if (!isValidUrl(url)) return null;

  try {
    const trimmed = url.trim();
    const urlObj = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (isBlockedHostname(urlObj.hostname)) return null;
    return urlObj.origin;
  } catch {
    return null;
  }
}

/**
 * Internal helper to fetch favicon with individual request timeouts
 */
async function _fetchFaviconWithTimeout(websiteUrl: string): Promise<string> {
  if (!websiteUrl) return DEFAULT_FAVICON;

  const domain = extractDomain(websiteUrl);
  if (!domain) return DEFAULT_FAVICON;

  // Common favicon paths to try
  const faviconPaths = [
    `${domain}/favicon.ico`,
    `${domain}/favicon.png`,
    `${domain}/favicon.svg`,
    `${domain}/apple-touch-icon.png`,
    `${domain}/apple-touch-icon-180x180.png`,
  ];

  // Try each favicon path with timeout to prevent stuck
  for (const faviconUrl of faviconPaths) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout per request

      const response = await fetch(faviconUrl, {
        method: "HEAD",
        redirect: "manual",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return faviconUrl;
      }
    } catch (error) {
      // Log timeout errors for debugging but continue to next URL
      if (error instanceof Error && error.name === "AbortError") {
        console.log(`[favicon] Timeout fetching: ${faviconUrl}`);
      }
    }
  }

  // If all fails, use favicon service as fallback
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
}

/**
 * Fetch favicon from website URL with overall timeout to prevent submit blocking
 * Simple approach: try common favicon paths with total 8s timeout
 */
export async function fetchFavicon(websiteUrl: string): Promise<string> {
  try {
    // Race between favicon fetch and overall timeout
    const result = await Promise.race([
      _fetchFaviconWithTimeout(websiteUrl),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("Overall timeout")), 8000),
      ),
    ]);
    return result;
  } catch (error) {
    console.log(`[favicon] Overall timeout or error, using fallback:`, error);
    // Return fallback URL if everything fails
    const domain = extractDomain(websiteUrl);
    if (domain) {
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
    }
    return DEFAULT_FAVICON;
  }
}

/**
 * Client-side favicon fetcher (for form preview)
 */
export function getFaviconUrl(websiteUrl: string): string {
  if (!websiteUrl) return DEFAULT_FAVICON;

  const domain = extractDomain(websiteUrl);
  if (!domain) return DEFAULT_FAVICON;

  // Use Google's favicon service for reliable client-side fetching
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
}
