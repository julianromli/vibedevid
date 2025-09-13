import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams {
  params: {
    id: string
  }
}

// GET - Get single vibe video by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Video ID diperlukan' },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    const { data: video, error } = await supabase
      .from('vibe_videos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return NextResponse.json(
          { error: 'Video tidak ditemukan' },
          { status: 404 },
        )
      }

      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Gagal mengambil data video' },
        { status: 500 },
      )
    }

    // Transform data untuk compatibility dengan frontend
    const transformedVideo = {
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
    }

    return NextResponse.json({ video: transformedVideo })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Terjadi error saat mengambil data video cuy!' },
      { status: 500 },
    )
  }
}

// PUT - Update vibe video by ID
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const body = await request.json()
    const {
      title,
      description,
      thumbnail,
      video_id,
      published_at,
      view_count,
      position,
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Video ID diperlukan' },
        { status: 400 },
      )
    }

    // Validation - at least one field should be provided for update
    if (
      !title &&
      !description &&
      !thumbnail &&
      !video_id &&
      !published_at &&
      !view_count &&
      position === undefined
    ) {
      return NextResponse.json(
        { error: 'Minimal satu field harus diisi untuk update!' },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    // For admin operations, we'll use service role key
    // So no need to check authentication for now
    // TODO: Add proper admin authentication later

    // Prepare update object - only include provided fields
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail
    if (video_id !== undefined) updateData.video_id = video_id
    if (published_at !== undefined) updateData.published_at = published_at
    if (view_count !== undefined) updateData.view_count = view_count
    if (position !== undefined) updateData.position = position

    // Update video
    const { data: updatedVideo, error } = await supabase
      .from('vibe_videos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return NextResponse.json(
          { error: 'Video tidak ditemukan' },
          { status: 404 },
        )
      }

      if (error.code === '23505') {
        // Unique constraint violation
        return NextResponse.json(
          { error: 'Video dengan ID ini sudah ada dalam database' },
          { status: 409 },
        )
      }

      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Gagal mengupdate video' },
        { status: 500 },
      )
    }

    // Transform response
    const transformedVideo = {
      id: updatedVideo.id,
      title: updatedVideo.title,
      description: updatedVideo.description,
      thumbnail: updatedVideo.thumbnail,
      videoId: updatedVideo.video_id,
      publishedAt: updatedVideo.published_at,
      viewCount: updatedVideo.view_count,
      position: updatedVideo.position,
      createdAt: updatedVideo.created_at,
      updatedAt: updatedVideo.updated_at,
    }

    return NextResponse.json({
      message: 'Video berhasil diupdate!',
      video: transformedVideo,
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Terjadi error saat mengupdate video cuy!' },
      { status: 500 },
    )
  }
}

// DELETE - Delete vibe video by ID
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Video ID diperlukan' },
        { status: 400 },
      )
    }

    const supabase = createAdminClient()

    // For admin operations, we'll use service role key
    // So no need to check authentication for now
    // TODO: Add proper admin authentication later

    // Get video data first for logging
    const { data: videoToDelete } = await supabase
      .from('vibe_videos')
      .select('title, position')
      .eq('id', id)
      .single()

    // Delete video
    const { error } = await supabase.from('vibe_videos').delete().eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Gagal menghapus video dari database' },
        { status: 500 },
      )
    }

    // After deletion, we might want to reorder positions
    // But for now, we'll keep the gaps in position numbers

    return NextResponse.json({
      message: `Video "${videoToDelete?.title || 'Unknown'}" berhasil dihapus!`,
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Terjadi error saat menghapus video cuy!' },
      { status: 500 },
    )
  }
}
