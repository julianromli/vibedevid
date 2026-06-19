import { createFileRoute } from '@tanstack/react-router'
import { cleanDescription, extractYouTubeVideoId, generateYouTubeUrl, isValidVideoId } from '@/lib/youtube-utils'

interface YouTubeOEmbedResponse {
  title: string
  author_name: string
  author_url: string
  type: string
  height: number
  width: number
  version: string
  provider_name: string
  provider_url: string
  thumbnail_height: number
  thumbnail_width: number
  thumbnail_url: string
  html: string
}

interface VideoMetadata {
  title: string
  description: string
  thumbnail: string
  views: number
  publishedAt: string
  channelTitle: string
  videoId: string
  url: string
}

async function fetchYouTubeMetadata(url: string): Promise<Response> {
  if (!url) {
    return Response.json({ error: 'URL YouTube diperlukan cuy!' }, { status: 400 })
  }

  const videoId = extractYouTubeVideoId(url)
  if (!videoId || !isValidVideoId(videoId)) {
    return Response.json({ error: 'URL YouTube tidak valid. Pastiin format yang benar ya!' }, { status: 400 })
  }

  const watchUrl = generateYouTubeUrl(videoId)
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`

  let oembedData: YouTubeOEmbedResponse
  try {
    const oembedResponse = await fetch(oembedUrl)
    if (!oembedResponse.ok) {
      throw new Error('Video tidak ditemukan atau private')
    }
    oembedData = await oembedResponse.json()
  } catch {
    return Response.json(
      {
        error: 'Video tidak dapat diakses. Mungkin private atau tidak tersedia.',
      },
      { status: 404 },
    )
  }

  let views = 0
  let publishedAt = ''
  let description = ''

  try {
    const watchResponse = await fetch(watchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        DNT: '1',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    })

    if (watchResponse.ok) {
      const html = await watchResponse.text()

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

      let viewsFound = false
      for (const pattern of viewPatterns) {
        const match = html.match(pattern)
        if (match?.[1]) {
          const viewsStr = match[1].replace(/[,\s]/g, '')
          const parsedViews = Number.parseInt(viewsStr)
          if (!Number.isNaN(parsedViews) && parsedViews > 0) {
            views = parsedViews
            viewsFound = true
            console.log(`[YouTube Debug] Views found using pattern: ${pattern.source}, value: ${views}`)
            break
          }
        }
      }

      if (!viewsFound) {
        console.warn(`[YouTube Debug] No views found for video ${videoId}. HTML length: ${html.length}`)
        viewPatterns.slice(0, 3).forEach((pattern, i) => {
          const match = html.match(pattern)
          console.log(`[YouTube Debug] Pattern ${i + 1}: ${pattern.source} - Match: ${match ? match[1] : 'none'}`)
        })
      }

      const publishPatterns = [
        /"publishDate":"([^"]+)"/,
        /"dateText":{"simpleText":"([^"]+)"}/,
        /"publishedTimeText":{"simpleText":"([^"]+)"}/,
        /uploadDate":"([^"]+)"/,
        /<meta itemprop="uploadDate" content="([^"]+)"/,
        /<meta itemprop="datePublished" content="([^"]+)"/,
        /"videoDetails":{[^}]*"publishDate":"([^"]+)"/,
        /rel="canonical" href="[^"]*"[^>]*data-published="([^"]+)"/,
      ]

      let publishFound = false
      for (const pattern of publishPatterns) {
        const match = html.match(pattern)
        if (match?.[1]) {
          publishedAt = match[1]
          publishFound = true
          console.log(`[YouTube Debug] Publish date found using pattern: ${pattern.source}, value: ${publishedAt}`)
          break
        }
      }

      if (!publishFound) {
        console.warn(`[YouTube Debug] No publish date found for video ${videoId}`)
        publishPatterns.slice(0, 3).forEach((pattern, i) => {
          const match = html.match(pattern)
          console.log(
            `[YouTube Debug] Publish pattern ${i + 1}: ${pattern.source} - Match: ${match ? match[1] : 'none'}`,
          )
        })
      }

      const descriptionMatch = html.match(/"description":{"simpleText":"([^"]+)"}/)
      if (descriptionMatch) {
        description = descriptionMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\u([0-9a-fA-F]{4})/g, (_match, code) => String.fromCharCode(Number.parseInt(code, 16)))
      }

      if (!description) {
        const metaDescMatch = html.match(/<meta name="description" content="([^"]+)"/)
        if (metaDescMatch) {
          description = metaDescMatch[1]
        }
      }
    }
  } catch (error) {
    console.warn('Could not scrape additional data:', error)
  }

  const videoData: VideoMetadata = {
    title: oembedData.title,
    description: cleanDescription(description || `Video by ${oembedData.author_name}`, 300),
    thumbnail: oembedData.thumbnail_url.replace('hqdefault', 'maxresdefault'),
    views,
    publishedAt: publishedAt || 'Date not available',
    channelTitle: oembedData.author_name,
    videoId,
    url: watchUrl,
  }

  return Response.json(videoData)
}

export const Route = createFileRoute('/api/youtube')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { url } = await request.json()
          return fetchYouTubeMetadata(url)
        } catch (error) {
          console.error('YouTube API Error:', error)
          return Response.json({ error: 'Terjadi error saat mengambil data video. Coba lagi ya cuy!' }, { status: 500 })
        }
      },

      GET: async ({ request }) => {
        const { searchParams } = new URL(request.url)
        const url = searchParams.get('url')

        if (!url) {
          return Response.json(
            {
              error: 'Parameter "url" diperlukan. Contoh: /api/youtube?url=https://youtube.com/watch?v=VIDEO_ID',
            },
            { status: 400 },
          )
        }

        try {
          return fetchYouTubeMetadata(url)
        } catch (error) {
          console.error('YouTube API Error:', error)
          return Response.json({ error: 'Terjadi error saat mengambil data video. Coba lagi ya cuy!' }, { status: 500 })
        }
      },
    },
  },
})
