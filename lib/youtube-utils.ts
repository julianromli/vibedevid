/**
 * Extract YouTube video ID from berbagai format URL
 * Support: watch, youtu.be, shorts, embed, dll
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null

  try {
    const urlObj = new URL(url.trim())

    // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/watch') {
      return urlObj.searchParams.get('v')
    }

    // Short URL: https://youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1) // Remove leading slash
    }

    // Shorts: https://www.youtube.com/shorts/VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/shorts/')) {
      return urlObj.pathname.split('/shorts/')[1]
    }

    // Embed: https://www.youtube.com/embed/VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/embed/')) {
      return urlObj.pathname.split('/embed/')[1]
    }

    // Live URL: https://www.youtube.com/live/VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.startsWith('/live/')) {
      return urlObj.pathname.split('/live/')[1]
    }

    return null
  } catch {
    // Fallback regex untuk catch edge cases
    const regexPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
      /[&?]v=([a-zA-Z0-9_-]{11})/,
    ]

    for (const pattern of regexPatterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }

    return null
  }
}

/**
 * Validate YouTube video ID format
 */
export function isValidVideoId(videoId: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId)
}

/**
 * Generate YouTube URL dari video ID
 */
export function generateYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

/**
 * Extract JSON dari HTML response (untuk scraping YouTube page)
 */
export function extractJsonFromHtml(html: string, key: string): any | null {
  try {
    // Cari pattern: var YOUTUBE_KEY = {...}; atau window.YOUTUBE_KEY = {...};
    const patterns = [
      new RegExp(`var\\s+${key}\\s*=\\s*({.+?});`, 's'),
      new RegExp(`window\\["${key}"\\]\\s*=\\s*({.+?});`, 's'),
      new RegExp(`"${key}"\\s*:\\s*({.+?})`, 's'),
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        return JSON.parse(match[1])
      }
    }

    return null
  } catch (error) {
    console.error(`Error parsing ${key} from HTML:`, error)
    return null
  }
}

/**
 * Format number untuk views count (1.2M, 45K, etc)
 */
export function formatViewCount(views: number): string {
  if (views >= 1000000000) {
    return (views / 1000000000).toFixed(1) + 'B'
  } else if (views >= 1000000) {
    return (views / 1000000).toFixed(1) + 'M'
  } else if (views >= 1000) {
    return (views / 1000).toFixed(1) + 'K'
  }
  return views.toString()
}

/**
 * Parse duration dari ISO 8601 format (PT4M13S -> "4:13")
 */
export function parseDuration(duration: string): string {
  try {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return '0:00'

    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
  } catch {
    return '0:00'
  }
}

/**
 * Clean dan truncate description untuk preview
 */
export function cleanDescription(description: string, maxLength: number = 200): string {
  if (!description) return ''

  // Remove excessive whitespace dan newlines
  const cleaned = description.replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim()

  if (cleaned.length <= maxLength) return cleaned

  // Truncate at word boundary
  const truncated = cleaned.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  return lastSpace > maxLength * 0.8 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
}
