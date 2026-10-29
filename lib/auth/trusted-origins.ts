/**
 * Cloudflare preview URLs of this worker look like
 * `https://<branch-or-version>-vibedevid.<account>.workers.dev`. They share the
 * production vars, so BETTER_AUTH_URL still points at the production host and
 * Better Auth rejects the preview's own Origin (INVALID_ORIGIN).
 *
 * When the request itself is served from such a preview host, trust that one
 * origin. Production requests never trust preview origins, and a preview never
 * trusts another preview.
 */
export function previewTrustedOrigins(request: Request | undefined, hostSuffix: string): string[] {
  if (!request || !hostSuffix) return [];

  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return [];
  }
  if (url.protocol !== "https:" || !url.hostname.endsWith(hostSuffix)) return [];

  // Exactly one DNS label in front of the suffix.
  const label = url.hostname.slice(0, -hostSuffix.length);
  if (!/^[a-z0-9-]+$/.test(label)) return [];

  return [url.origin];
}
