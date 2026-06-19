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

export const Route = createFileRoute('/api/vibe-videos')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const supabase = createAdminClient()

          const { data: videos, error } = await supabase
            .from('vibe_videos')
            .select('*')
            .order('position', { ascending: true })

          if (error) {
            console.error('Database error:', error)
            return Response.json({ error: 'Failed to fetch videos from database' }, { status: 500 })
          }

          const transformedVideos = videos?.map(transformVideo) || []

          return Response.json({ videos: transformedVideos })
        } catch (error) {
          console.error('API Error:', error)
          return Response.json({ error: 'Terjadi error saat mengambil data video cuy!' }, { status: 500 })
        }
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const { title, description, thumbnail, video_id, published_at, view_count } = body

          if (!title || !description || !thumbnail || !video_id || !published_at) {
            return Response.json(
              {
                error: 'Field title, description, thumbnail, video_id, dan published_at wajib diisi!',
              },
              { status: 400 },
            )
          }

          const supabase = createAdminClient()

          const { data: maxPositionData } = await supabase
            .from('vibe_videos')
            .select('position')
            .order('position', { ascending: false })
            .limit(1)
            .single()

          const nextPosition = maxPositionData ? maxPositionData.position + 1 : 1

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
              return Response.json({ error: 'Video dengan ID ini sudah ada dalam database' }, { status: 409 })
            }

            console.error('Database error:', error)
            return Response.json({ error: 'Gagal menambahkan video ke database' }, { status: 500 })
          }

          return Response.json(
            {
              message: 'Video berhasil ditambahkan!',
              video: transformVideo(newVideo),
            },
            { status: 201 },
          )
        } catch (error) {
          console.error('API Error:', error)
          return Response.json({ error: 'Terjadi error saat menambahkan video cuy!' }, { status: 500 })
        }
      },
    },
  },
})
