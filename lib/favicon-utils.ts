/**
 * Utility functions for fetching website favicons
 */

const DEFAULT_FAVICON = '/default-favicon.svg'

/**
 * Validate if a string is a proper URL with valid hostname
 * Must have protocol, valid hostname with TLD (e.g., example.com)
 */
function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false

  // Trim and check for empty/whitespace-only strings
  const trimmed = url.trim()
  if (!trimmed || trimmed.length < 4) return false

  try {
    const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)

    // Must have a valid hostname (not empty, not just protocol)
    if (!urlObj.hostname || urlObj.hostname.length < 1) return false

    // Hostname must contain at least one dot (TLD requirement)
    // This prevents "https" or "http" being treated as valid domains
    if (!urlObj.hostname.includes('.')) return false

    // Hostname should not be just numbers (invalid domain)
    if (/^\d+$/.test(urlObj.hostname.replace(/\./g, ''))) return false

    return true
  } catch {
    return false
  }
}

/**
 * Extract domain from URL with strict validation
 */
function extractDomain(url: string): string | null {
  if (!isValidUrl(url)) return null

  try {
    const trimmed = url.trim()
    const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    return urlObj.origin
  } catch {
    return null
  }
}

/**
 * Internal helper to fetch favicon with individual request timeouts
 */
async function _fetchFaviconWithTimeout(websiteUrl: string): Promise<string> {
  if (!websiteUrl) return DEFAULT_FAVICON

  const domain = extractDomain(websiteUrl)
  if (!domain) return DEFAULT_FAVICON

  // Common favicon paths to try
  const faviconPaths = [
    `${domain}/favicon.ico`,
    `${domain}/favicon.png`,
    `${domain}/favicon.svg`,
    `${domain}/apple-touch-icon.png`,
    `${domain}/apple-touch-icon-180x180.png`,
  ]

  // Try each favicon path with timeout to prevent stuck
  for (const faviconUrl of faviconPaths) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout per request

      const response = await fetch(faviconUrl, {
        method: 'HEAD',
        mode: 'no-cors', // Avoid CORS issues
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // If request doesn't fail, assume favicon exists
      // Note: with no-cors, we can't check response.ok, but lack of error means likely success
      return faviconUrl
    } catch (error) {
      // Log timeout errors for debugging but continue to next URL
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`[favicon] Timeout fetching: ${faviconUrl}`)
      }
    }
  }

  // If all fails, use favicon service as fallback
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`
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
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Overall timeout')), 8000)),
    ])
    return result
  } catch (error) {
    console.log(`[favicon] Overall timeout or error, using fallback:`, error)
    // Return fallback URL if everything fails
    const domain = extractDomain(websiteUrl)
    if (domain) {
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`
    }
    return DEFAULT_FAVICON
  }
}

/**
 * Client-side favicon fetcher (for form preview)
 */
export function getFaviconUrl(websiteUrl: string): string {
  if (!websiteUrl) return DEFAULT_FAVICON

  const domain = extractDomain(websiteUrl)
  if (!domain) return DEFAULT_FAVICON

  // Use Google's favicon service for reliable client-side fetching
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`
}
