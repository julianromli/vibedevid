import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchYouTubeVideoMetadata, YouTubeMetadataError } from '@/lib/youtube-metadata'

describe('fetchYouTubeVideoMetadata', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the metadata shape expected by the admin video manager', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            title: 'Build a Vibe Coding App',
            author_name: 'VibeDev ID',
            thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          '<html><body>{"viewCount":"12345","publishDate":"2026-06-01","description":{"simpleText":"A useful demo"}}</body></html>',
          { status: 200 },
        ),
      )

    const metadata = await fetchYouTubeVideoMetadata('https://www.youtube.com/watch?v=dQw4w9WgXcQ')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(metadata).toEqual({
      title: 'Build a Vibe Coding App',
      description: 'A useful demo',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      views: 12345,
      publishedAt: '2026-06-01',
      channelTitle: 'VibeDev ID',
      videoId: 'dQw4w9WgXcQ',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    })
  })

  it('rejects invalid YouTube URLs before fetching', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')

    await expect(fetchYouTubeVideoMetadata('https://example.com/not-youtube')).rejects.toBeInstanceOf(
      YouTubeMetadataError,
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
