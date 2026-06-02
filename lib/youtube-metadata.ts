import { cleanDescription, extractYouTubeVideoId, generateYouTubeUrl, isValidVideoId } from '@/lib/youtube-utils'

type YouTubeOEmbedResponse = {
  title: string
  author_name: string
  thumbnail_url: string
}

export type YouTubeVideoMetadata = {
  title: string
  description: string
  thumbnail: string
  views: number
  publishedAt: string
  channelTitle: string
  videoId: string
  url: string
}

export class YouTubeMetadataError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message)
    this.name = 'YouTubeMetadataError'
  }
}

const WATCH_PAGE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
}

function parseViewCount(html: string): number {
  const viewPatterns = [
    /"viewCount":\s*"(\d+)"/,
    /"viewCount":{"videoViewCountRenderer":{"viewCount":{"simpleText":"([\d,]+)/,
    /"videoViewCountRenderer":{"viewCount":{"simpleText":"([\d,]+)/,
    /viewCount":{"runs":\[{"text":"([\d,]+)/,
    /views":{"runs":\[{"text":"([\d,]+)/,
    /shortViewCount":{"simpleText":"([\d,]+)/,
    /"shortViewCount":{"accessibility":{"accessibilityData":{"label":"([\d,]+)/,
    /<meta itemprop="interactionCount" content="(\d+)"/,
  ]

  for (const pattern of viewPatterns) {
    const match = html.match(pattern)
    const value = match?.[1]?.replace(/[,\s]/g, '')
    const views = value ? Number.parseInt(value, 10) : 0

    if (Number.isFinite(views) && views > 0) {
      return views
    }
  }

  return 0
}

function parsePublishedAt(html: string): string {
  const publishPatterns = [
    /"publishDate":"([^"]+)"/,
    /"dateText":{"simpleText":"([^"]+)"}/,
    /"publishedTimeText":{"simpleText":"([^"]+)"}/,
    /uploadDate":"([^"]+)"/,
    /<meta itemprop="uploadDate" content="([^"]+)"/,
    /<meta itemprop="datePublished" content="([^"]+)"/,
    /"videoDetails":{[^}]*"publishDate":"([^"]+)"/,
  ]

  for (const pattern of publishPatterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      return match[1]
    }
  }

  return new Date().toISOString().slice(0, 10)
}

function parseDescription(html: string): string {
  const descriptionMatch = html.match(/"description":{"simpleText":"([^"]+)"}/)
  if (descriptionMatch?.[1]) {
    return descriptionMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\u([0-9a-fA-F]{4})/g, (_match, code: string) => String.fromCharCode(Number.parseInt(code, 16)))
  }

  const metaDescMatch = html.match(/<meta name="description" content="([^"]+)"/)
  return metaDescMatch?.[1] ?? ''
}

async function fetchWatchPageDetails(watchUrl: string) {
  try {
    const response = await fetch(watchUrl, { headers: WATCH_PAGE_HEADERS })
    if (!response.ok) {
      return { views: 0, publishedAt: new Date().toISOString().slice(0, 10), description: '' }
    }

    const html = await response.text()
    return {
      views: parseViewCount(html),
      publishedAt: parsePublishedAt(html),
      description: parseDescription(html),
    }
  } catch {
    return { views: 0, publishedAt: new Date().toISOString().slice(0, 10), description: '' }
  }
}

export async function fetchYouTubeVideoMetadata(url: string): Promise<YouTubeVideoMetadata> {
  if (!url) {
    throw new YouTubeMetadataError('URL YouTube diperlukan cuy!', 400)
  }

  const videoId = extractYouTubeVideoId(url)
  if (!videoId || !isValidVideoId(videoId)) {
    throw new YouTubeMetadataError('URL YouTube tidak valid. Pastiin format yang benar ya!', 400)
  }

  const watchUrl = generateYouTubeUrl(videoId)
  const oembedResponse = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`)

  if (!oembedResponse.ok) {
    throw new YouTubeMetadataError('Video tidak dapat diakses. Mungkin private atau tidak tersedia.', 404)
  }

  const oembedData = (await oembedResponse.json()) as YouTubeOEmbedResponse
  const details = await fetchWatchPageDetails(watchUrl)

  return {
    title: oembedData.title,
    description: cleanDescription(details.description || `Video by ${oembedData.author_name}`, 300),
    thumbnail: oembedData.thumbnail_url.replace('hqdefault', 'maxresdefault'),
    views: details.views,
    publishedAt: details.publishedAt,
    channelTitle: oembedData.author_name,
    videoId,
    url: watchUrl,
  }
}
