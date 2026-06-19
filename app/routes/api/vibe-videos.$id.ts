import { createFileRoute } from '@tanstack/react-router'
import { createAdminClient } from '@/lib/supabase/admin'

function transformVideo(video: {
  id: string
  title: string
  description: string
  thumbnail: string
  video_id: string
  published_at: string
  view_count: string
  position: number
  created_at: string
  updated_at: string
}) {
  return {
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
}

export const Route = createFileRoute('/api/vibe-videos/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const { id } = params

          if (!id) {
            return Response.json({ error: 'Video ID diperlukan' }, { status: 400 })
          }

          const supabase = createAdminClient()

          const { data: video, error } = await supabase.from('vibe_videos').select('*').eq('id', id).single()

          if (error) {
            if (error.code === 'PGRST116') {
              return Response.json({ error: 'Video tidak ditemukan' }, { status: 404 })
            }

            console.error('Database error:', error)
            return Response.json({ error: 'Gagal mengambil data video' }, { status: 500 })
          }

          return Response.json({ video: transformVideo(video) })
        } catch (error) {
          console.error('API Error:', error)
          return Response.json({ error: 'Terjadi error saat mengambil data video cuy!' }, { status: 500 })
        }
      },

      PUT: async ({ request, params }) => {
        try {
          const { id } = params
          const body = await request.json()
          const { title, description, thumbnail, video_id, published_at, view_count, position } = body

          if (!id) {
            return Response.json({ error: 'Video ID diperlukan' }, { status: 400 })
          }

          if (!title && !description && !thumbnail && !video_id && !published_at && !view_count && position === undefined) {
            return Response.json({ error: 'Minimal satu field harus diisi untuk update!' }, { status: 400 })
          }

          const supabase = createAdminClient()

          const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          }

          if (title !== undefined) updateData.title = title
          if (description !== undefined) updateData.description = description
          if (thumbnail !== undefined) updateData.thumbnail = thumbnail
          if (video_id !== undefined) updateData.video_id = video_id
          if (published_at !== undefined) updateData.published_at = published_at
          if (view_count !== undefined) updateData.view_count = view_count
          if (position !== undefined) updateData.position = position

          const { data: updatedVideo, error } = await supabase
            .from('vibe_videos')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

          if (error) {
            if (error.code === 'PGRST116') {
              return Response.json({ error: 'Video tidak ditemukan' }, { status: 404 })
            }

            if (error.code === '23505') {
              return Response.json({ error: 'Video dengan ID ini sudah ada dalam database' }, { status: 409 })
            }

            console.error('Database error:', error)
            return Response.json({ error: 'Gagal mengupdate video' }, { status: 500 })
          }

          return Response.json({
            message: 'Video berhasil diupdate!',
            video: transformVideo(updatedVideo),
          })
        } catch (error) {
          console.error('API Error:', error)
          return Response.json({ error: 'Terjadi error saat mengupdate video cuy!' }, { status: 500 })
        }
      },

      DELETE: async ({ params }) => {
        try {
          const { id } = params

          if (!id) {
            return Response.json({ error: 'Video ID diperlukan' }, { status: 400 })
          }

          const supabase = createAdminClient()

          const { data: videoToDelete } = await supabase
            .from('vibe_videos')
            .select('title, position')
            .eq('id', id)
            .single()

          const { error } = await supabase.from('vibe_videos').delete().eq('id', id)

          if (error) {
            console.error('Database error:', error)
            return Response.json({ error: 'Gagal menghapus video dari database' }, { status: 500 })
          }

          return Response.json({
            message: `Video "${videoToDelete?.title || 'Unknown'}" berhasil dihapus!`,
          })
        } catch (error) {
          console.error('API Error:', error)
          return Response.json({ error: 'Terjadi error saat menghapus video cuy!' }, { status: 500 })
        }
      },
    },
  },
})
