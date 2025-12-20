import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

import { siteConfig } from '@/config/site'

export const runtime = 'edge'

const Geist = fetch(new URL('../../../public/fonts/Geist-Regular.ttf', import.meta.url)).then((response) =>
  response.arrayBuffer(),
)

export async function GET(request: NextRequest) {
  try {
    const fontSans = await Geist

    const { searchParams } = request.nextUrl
    const title = searchParams.get('title')

    if (!title) {
      return new Response('Missing title', { status: 400 })
    }

    const heading = title.length > 140 ? title.slice(0, 140) + '...' : title
    return new ImageResponse(
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
          color: '#000',
          fontFamily: "'Geist', sans-serif",
          fontSize: '48px',
          fontWeight: 400,
          lineHeight: '1.2',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        Hello World
      </div>,
    )
  } catch (error) {
    console.log('Failed to generate image:', error)
    return new Response('Failed to generate the image', { status: 500 })
  }
}
