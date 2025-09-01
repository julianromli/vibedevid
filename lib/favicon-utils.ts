/**
 * Utility functions for fetching website favicons
 */

const DEFAULT_FAVICON = "/default-favicon.svg"

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    return urlObj.origin
  } catch {
    return null
  }
}

/**
 * Fetch favicon from website URL
 * Simple approach: try common favicon paths
 */
export async function fetchFavicon(websiteUrl: string): Promise<string> {
  if (!websiteUrl) return DEFAULT_FAVICON
  
  const domain = extractDomain(websiteUrl)
  if (!domain) return DEFAULT_FAVICON

  // Common favicon paths to try
  const faviconPaths = [
    `${domain}/favicon.ico`,
    `${domain}/favicon.png`, 
    `${domain}/favicon.svg`,
    `${domain}/apple-touch-icon.png`,
    `${domain}/apple-touch-icon-180x180.png`
  ]

  // Try each favicon path
  for (const faviconUrl of faviconPaths) {
    try {
      const response = await fetch(faviconUrl, { 
        method: 'HEAD',
        mode: 'no-cors' // Avoid CORS issues
      })
      
      // If request doesn't fail, assume favicon exists
      // Note: with no-cors, we can't check response.ok, but lack of error means likely success
      return faviconUrl
    } catch {
      continue
    }
  }

  // If all fails, use favicon service as fallback
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`
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
