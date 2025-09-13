import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

interface VibeVideo {
  id?: string
  title: string
  description: string
  thumbnail: string
  video_id: string
  published_at: string
  view_count: string
  position: number
}

// GET - List all vibe videos ordered by position
export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: videos, error } = await supabase
      .from('vibe_videos')
      .select('*')
      .order('position', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch videos from database' },
        { status: 500 },
      )
    }

    // Transform data untuk compatibility dengan frontend
    const transformedVideos =
      videos?.map((video) => ({
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail,
        videoId: video.video_id,
        publishedAt: video.published_at,
        viewCount: video.view_count,
        position: video.position,
        createdAt: video.created_at,
        updatedAt: video.updated_at,
      })) || []

    return NextResponse.json({ videos: transformedVideos })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Terjadi error saat mengambil data video cuy!' },
      { status: 500 },
    )
  }
}

// POST - Create new vibe video
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      thumbnail,
      video_id,
      published_at,
      view_count,
    } = body

    // Validation
    if (!title || !description || !thumbnail || !video_id || !published_at) {
      return NextResponse.json(
        {
          error:
            'Field title, description, thumbnail, video_id, dan published_at wajib diisi!',
        },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    // For admin operations, we'll use service role key
    // So no need to check authentication for now
    // TODO: Add proper admin authentication later

    // Get next position (max + 1)
    const { data: maxPositionData } = await supabase
      .from('vibe_videos')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const nextPosition = maxPositionData ? maxPositionData.position + 1 : 1

    // Insert new video
    const { data: newVideo, error } = await supabase
      .from('vibe_videos')
      .insert({
        title,
        description,
        thumbnail,
        video_id,
        published_at,
        view_count: view_count || '0',
        position: nextPosition,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        return NextResponse.json(
          { error: 'Video dengan ID ini sudah ada dalam database' },
          { status: 409 },
        )
      }

      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Gagal menambahkan video ke database' },
        { status: 500 },
      )
    }

    // Transform response
    const transformedVideo = {
      id: newVideo.id,
      title: newVideo.title,
      description: newVideo.description,
      thumbnail: newVideo.thumbnail,
      videoId: newVideo.video_id,
      publishedAt: newVideo.published_at,
      viewCount: newVideo.view_count,
      position: newVideo.position,
      createdAt: newVideo.created_at,
      updatedAt: newVideo.updated_at,
    }

    return NextResponse.json(
      {
        message: 'Video berhasil ditambahkan!',
        video: transformedVideo,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Terjadi error saat menambahkan video cuy!' },
      { status: 500 },
    )
  }
}
