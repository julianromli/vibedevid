import { NextRequest, NextResponse } from 'next/server'
import { extractYouTubeVideoId, isValidVideoId, generateYouTubeUrl, cleanDescription } from '@/lib/youtube-utils'

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

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL YouTube diperlukan cuy!' },
        { status: 400 }
      )
    }

    // Extract video ID dari URL
    const videoId = extractYouTubeVideoId(url)
    if (!videoId || !isValidVideoId(videoId)) {
      return NextResponse.json(
        { error: 'URL YouTube tidak valid. Pastiin format yang benar ya!' },
        { status: 400 }
      )
    }

    const watchUrl = generateYouTubeUrl(videoId)

    // 1. Fetch basic info dari oEmbed (tidak butuh API key)
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`
    
    let oembedData: YouTubeOEmbedResponse
    try {
      const oembedResponse = await fetch(oembedUrl)
      if (!oembedResponse.ok) {
        throw new Error('Video tidak ditemukan atau private')
      }
      oembedData = await oembedResponse.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Video tidak dapat diakses. Mungkin private atau tidak tersedia.' },
        { status: 404 }
      )
    }

    // 2. Scrape YouTube watch page untuk detailed stats
    let views = 0
    let publishedAt = ''
    let description = ''

    try {
      const watchResponse = await fetch(watchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      })
      
      if (watchResponse.ok) {
        const html = await watchResponse.text()
        
        // Multiple patterns untuk extract views - YouTube sering ganti structure
        const viewPatterns = [
          /"viewCount":\s*"(\d+)"/,
          /"viewCount":{"videoViewCountRenderer":{"viewCount":{"simpleText":"([\d,]+)/,
          /"videoViewCountRenderer":{"viewCount":{"simpleText":"([\d,]+)/,
          /viewCount":{"runs":\[{"text":"([\d,]+)/,
          /views\":{\"runs\":\[{\"text\":\"([\d,]+)/,
          /shortViewCount":{"simpleText":"([\d,]+)/,
          /"shortViewCount":{"accessibility":{"accessibilityData":{"label":"([\d,]+)/,
          /<meta itemprop="interactionCount" content="(\d+)"/
        ]
        
        let viewsFound = false
        for (const pattern of viewPatterns) {
          const match = html.match(pattern)
          if (match && match[1]) {
            // Parse views dan handle formatting (remove commas, etc)
            const viewsStr = match[1].replace(/[,\s]/g, '')
            const parsedViews = parseInt(viewsStr)
            if (!isNaN(parsedViews) && parsedViews > 0) {
              views = parsedViews
              viewsFound = true
              console.log(`[YouTube Debug] Views found using pattern: ${pattern.source}, value: ${views}`)
              break
            }
          }
        }
        
        if (!viewsFound) {
          console.warn(`[YouTube Debug] No views found for video ${videoId}. HTML length: ${html.length}`)
          // Log first few patterns untuk debugging
          viewPatterns.slice(0, 3).forEach((pattern, i) => {
            const match = html.match(pattern)
            console.log(`[YouTube Debug] Pattern ${i + 1}: ${pattern.source} - Match: ${match ? match[1] : 'none'}`)
          })
        }
        
        // Extract publish date - multiple patterns karena YouTube sering ganti structure
        const publishPatterns = [
          /"publishDate":"([^"]+)"/,
          /"dateText":{"simpleText":"([^"]+)"}/,
          /"publishedTimeText":{"simpleText":"([^"]+)"}/,
          /uploadDate\":\"([^\"]+)\"/,
          /<meta itemprop="uploadDate" content="([^"]+)"/,
          /<meta itemprop="datePublished" content="([^"]+)"/,
          /"videoDetails":{[^}]*"publishDate":"([^"]+)"/,
          /rel="canonical" href="[^"]*"[^>]*data-published="([^"]+)"/
        ]
        
        let publishFound = false
        for (const pattern of publishPatterns) {
          const match = html.match(pattern)
          if (match && match[1]) {
            publishedAt = match[1]
            publishFound = true
            console.log(`[YouTube Debug] Publish date found using pattern: ${pattern.source}, value: ${publishedAt}`)
            break
          }
        }
        
        if (!publishFound) {
          console.warn(`[YouTube Debug] No publish date found for video ${videoId}`)
          // Log first few patterns untuk debugging
          publishPatterns.slice(0, 3).forEach((pattern, i) => {
            const match = html.match(pattern)
            console.log(`[YouTube Debug] Publish pattern ${i + 1}: ${pattern.source} - Match: ${match ? match[1] : 'none'}`)
          })
        }
        
        // Extract description dari microformat
        const descriptionMatch = html.match(/"description":{"simpleText":"([^"]+)"}/);
        if (descriptionMatch) {
          description = descriptionMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => String.fromCharCode(parseInt(code, 16)))
        }
        
        // Fallback untuk description dari meta tags
        if (!description) {
          const metaDescMatch = html.match(/<meta name="description" content="([^"]+)"/)
          if (metaDescMatch) {
            description = metaDescMatch[1]
          }
        }
      }
    } catch (error) {
      console.warn('Could not scrape additional data:', error)
      // Continue with oEmbed data saja
    }

    // Combine data dari oEmbed dan scraping
    const videoData: VideoMetadata = {
      title: oembedData.title,
      description: cleanDescription(description || `Video by ${oembedData.author_name}`, 300),
      thumbnail: oembedData.thumbnail_url.replace('hqdefault', 'maxresdefault'), // Get higher quality thumbnail
      views: views,
      publishedAt: publishedAt || 'Date not available', // Better fallback instead of today's date
      channelTitle: oembedData.author_name,
      videoId: videoId,
      url: watchUrl
    }

    return NextResponse.json(videoData)

  } catch (error) {
    console.error('YouTube API Error:', error)
    return NextResponse.json(
      { error: 'Terjadi error saat mengambil data video. Coba lagi ya cuy!' },
      { status: 500 }
    )
  }
}

// Support GET request untuk testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  
  if (!url) {
    return NextResponse.json(
      { error: 'Parameter "url" diperlukan. Contoh: /api/youtube?url=https://youtube.com/watch?v=VIDEO_ID' },
      { status: 400 }
    )
  }

  // Forward ke POST handler
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ url }),
    headers: { 'Content-Type': 'application/json' }
  }))
}
