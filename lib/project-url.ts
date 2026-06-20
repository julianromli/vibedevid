const URL_SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

function isLikelyBareWebsiteHost(hostname: string): boolean {
  const normalizedHostname = hostname.trim().toLowerCase();

  return normalizedHostname === "localhost" || normalizedHostname.includes(".");
}

export function normalizeProjectWebsiteUrl(input: string | null | undefined): string | null {
  if (typeof input !== "string") {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed || trimmed.startsWith("//")) {
    return null;
  }

  const hasScheme = URL_SCHEME_PATTERN.test(trimmed);
  const normalizedValue = hasScheme ? trimmed : `https://${trimmed}`;

  try {
    const parsedUrl = new URL(normalizedValue);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null;
    }

    if (!hasScheme && !isLikelyBareWebsiteHost(parsedUrl.hostname)) {
      return null;
    }

    return normalizedValue;
  } catch {
    return null;
  }
}

export function isValidProjectWebsiteUrl(input: string | null | undefined): boolean {
  if (typeof input !== "string" || input.trim().length === 0) {
    return true;
  }

  return normalizeProjectWebsiteUrl(input) !== null;
}
