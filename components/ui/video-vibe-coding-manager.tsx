"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { extractYouTubeVideoId } from '@/lib/youtube-utils'
import { Youtube, AlertCircle, ExternalLink, Eye, Calendar, Loader2, Edit, Trash2, RotateCcw } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface VideoData {
  title: string
  description: string
  thumbnail: string
  views: number
  publishedAt: string
  channelTitle: string
  videoId: string
  url: string
}

interface VibeVideoData {
  id: string
  title: string
  description: string
  thumbnail: string
  videoId: string
  publishedAt: string
  viewCount: string
  position: number
  createdAt: string
  updatedAt: string
}

export function VideoVibeCodingManager() {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Current videos management
  const [currentVideos, setCurrentVideos] = useState<VibeVideoData[]>([])
  const [videosLoading, setVideosLoading] = useState(true)
  const [videosError, setVideosError] = useState<string | null>(null)
  
  // Edit mode state
  const [editingVideo, setEditingVideo] = useState<VibeVideoData | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<VibeVideoData>>({})
  const [editYoutubeUrl, setEditYoutubeUrl] = useState('')
  const [editFetching, setEditFetching] = useState(false)
  const [editFetchError, setEditFetchError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!youtubeUrl.trim()) {
      setError('Masukkan URL YouTube dulu cuy! 🤔')
      return
    }

    const videoId = extractYouTubeVideoId(youtubeUrl)
    if (!videoId) {
      setError('URL YouTube tidak valid nih. Pastiin format yang benar ya! 😅')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: youtubeUrl }),
      })

      if (!response.ok) {
        throw new Error('Gagal fetch data video')
      }

      const data = await response.json()
      setVideoData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi error nih cuy 😕')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setYoutubeUrl('')
    setVideoData(null)
    setError(null)
  }

  // Fetch current videos dari database
  const fetchCurrentVideos = async () => {
    try {
      setVideosLoading(true)
      const response = await fetch('/api/vibe-videos')
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos')
      }
      
      const data = await response.json()
      setCurrentVideos(data.videos || [])
      setVideosError(null)
    } catch (err) {
      setVideosError(err instanceof Error ? err.message : 'Error fetching videos')
    } finally {
      setVideosLoading(false)
    }
  }

  // Load videos on component mount
  useEffect(() => {
    fetchCurrentVideos()
  }, [])

  // Handle add video ke database
  const handleAddToDatabase = async () => {
    if (!videoData) return
    
    try {
      setLoading(true)
      const response = await fetch('/api/vibe-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: videoData.title,
          description: videoData.description,
          thumbnail: videoData.thumbnail,
          video_id: videoData.videoId,
          published_at: videoData.publishedAt,
          view_count: videoData.views.toString(),
        }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add video')
      }

      // Refresh current videos list
      await fetchCurrentVideos()
      
      // Reset form
      resetForm()
      
      setError(null)
      // Show success message (optional)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding video to database')
    } finally {
      setLoading(false)
    }
  }

  // Handle delete video
  const handleDeleteVideo = async (videoId: string) => {
    try {
      const response = await fetch(`/api/vibe-videos/${videoId}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete video')
      }

      // Refresh current videos list
      await fetchCurrentVideos()
      setVideosError(null)
    } catch (err) {
      setVideosError(err instanceof Error ? err.message : 'Error deleting video')
    }
  }

  // Handle update video
  const handleUpdateVideo = async (videoId: string, updateData: Partial<VibeVideoData>) => {
    try {
      const response = await fetch(`/api/vibe-videos/${videoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: updateData.title,
          description: updateData.description,
          thumbnail: updateData.thumbnail,
          video_id: updateData.videoId,
          published_at: updateData.publishedAt,
          view_count: updateData.viewCount,
        }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update video')
      }

      // Refresh current videos list
      await fetchCurrentVideos()
      setEditingVideo(null)
      setEditFormData({})
      setVideosError(null)
    } catch (err) {
      setVideosError(err instanceof Error ? err.message : 'Error updating video')
    }
  }

  // Handle edit mode
  const startEditing = (video: VibeVideoData) => {
    setEditingVideo(video)
    setEditFormData({
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail,
      videoId: video.videoId,
      publishedAt: video.publishedAt,
      viewCount: video.viewCount,
    })
  }

  const cancelEditing = () => {
    setEditingVideo(null)
    setEditFormData({})
    setEditYoutubeUrl('')
    setEditFetching(false)
    setEditFetchError(null)
  }

  // Handle fetch YouTube data in edit mode
  const handleEditFetchYoutube = async () => {
    if (!editYoutubeUrl.trim()) {
      setEditFetchError('Masukkan URL YouTube dulu cuy! 🤔')
      return
    }

    const videoId = extractYouTubeVideoId(editYoutubeUrl)
    if (!videoId) {
      setEditFetchError('URL YouTube tidak valid nih. Pastiin format yang benar ya! 😅')
      return
    }

    setEditFetching(true)
    setEditFetchError(null)
    
    try {
      const response = await fetch('/api/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: editYoutubeUrl }),
      })

      if (!response.ok) {
        throw new Error('Gagal fetch data video')
      }

      const data = await response.json()
      
      // Auto-populate form fields with fetched data
      setEditFormData(prev => ({
        ...prev,
        title: data.title,
        description: data.description,
        thumbnail: data.thumbnail,
        videoId: data.videoId,
        publishedAt: data.publishedAt,
        viewCount: data.views.toString(),
      }))
      
      setEditFetchError(null)
    } catch (err) {
      setEditFetchError(err instanceof Error ? err.message : 'Terjadi error nih cuy 😕')
    } finally {
      setEditFetching(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" />
            Add YouTube Video
          </CardTitle>
          <CardDescription>
            Masukkan link YouTube untuk otomatis fetch semua detail video! 🎥
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="youtube-url" className="form-label-enhanced">
                YouTube URL
              </Label>
              <Input
                id="youtube-url"
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=example atau https://youtu.be/example"
                className="form-input-enhanced"
              />
              <p className="text-xs form-helper-text">
                Support berbagai format URL YouTube (watch, youtu.be, shorts, dll) 🎯
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Youtube className="w-4 h-4" />
                    Fetch Video Data
                  </>
                )}
              </Button>
              
              {videoData && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Reset
                </Button>
              )}
            </div>
          </form>

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Loading Skeleton */}
      {loading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Data Preview */}
      {videoData && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Video Preview ✨
              <Button variant="outline" size="sm" asChild>
                <a
                  href={videoData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Watch
                </a>
              </Button>
            </CardTitle>
            <CardDescription>
              Data berhasil di-fetch dari YouTube! 🎉
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Thumbnail */}
            <div className="relative">
              <img
                src={videoData.thumbnail}
                alt={videoData.title}
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              />
            </div>

            {/* Video Details */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                <h3 className="text-lg font-semibold mt-1">{videoData.title}</h3>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                  {videoData.description}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Channel</Label>
                <p className="font-medium mt-1">{videoData.channelTitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{videoData.views.toLocaleString()}</strong> views
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(videoData.publishedAt).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <Label className="text-sm font-medium text-muted-foreground">Video ID</Label>
                <code className="block mt-1 text-sm font-mono">{videoData.videoId}</code>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t">
              <Button 
                onClick={handleAddToDatabase}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding to Database...
                  </>
                ) : (
                  'Add to Video Vibe Coding Section'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Current Videos Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              Current Videos on Homepage
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchCurrentVideos}
              disabled={videosLoading}
            >
              {videosLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Manage video yang tampil di homepage. Total: {currentVideos.length} videos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {videosError && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{videosError}</AlertDescription>
            </Alert>
          )}
          
          {videosLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex gap-4 p-4 border rounded-lg">
                  <Skeleton className="w-24 h-16 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="w-8 h-8" />
                    <Skeleton className="w-8 h-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : currentVideos.length > 0 ? (
            <div className="space-y-4">
              {currentVideos.map((video) => (
                <div key={video.id} className="flex gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-24 h-16 object-cover rounded"
                    />
                  </div>
                  
                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    {editingVideo?.id === video.id ? (
                      // Edit Mode
                      <div className="space-y-2">
                        {/* YouTube URL Fetch Section */}
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                            <Youtube className="w-4 h-4" />
                            Replace with YouTube URL
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={editYoutubeUrl}
                              onChange={(e) => setEditYoutubeUrl(e.target.value)}
                              placeholder="https://www.youtube.com/watch?v=example"
                              className="text-xs h-8 flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={handleEditFetchYoutube}
                              disabled={editFetching}
                              className="h-8 px-3"
                            >
                              {editFetching ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  Fetching...
                                </>
                              ) : (
                                <>
                                  <Youtube className="w-3 h-3 mr-1" />
                                  Fetch
                                </>
                              )}
                            </Button>
                          </div>
                          {editFetchError && (
                            <p className="text-xs text-red-600">{editFetchError}</p>
                          )}
                        </div>
                        
                        {/* Manual Edit Fields */}
                        <Input
                          value={editFormData.title || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                          className="font-medium"
                          placeholder="Video title"
                        />
                        <textarea
                          value={editFormData.description || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full p-2 text-sm border rounded resize-none h-16 bg-background"
                          placeholder="Video description"
                        />
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <Input
                            value={editFormData.viewCount || ''}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, viewCount: e.target.value }))}
                            className="text-xs h-8 w-20"
                            placeholder="Views"
                          />
                          <Input
                            type="date"
                            value={editFormData.publishedAt || ''}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, publishedAt: e.target.value }))}
                            className="text-xs h-8 w-32"
                          />
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="space-y-1">
                        <h3 className="font-medium line-clamp-2 text-sm">
                          {video.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {video.description}
                        </p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {video.viewCount} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(video.publishedAt).toLocaleDateString('id-ID')}
                          </span>
                          <span>Position: {video.position}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex-shrink-0 flex gap-2">
                    {editingVideo?.id === video.id ? (
                      // Edit Mode Actions
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateVideo(video.id, editFormData)}
                          disabled={!editFormData.title?.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      // View Mode Actions
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(video)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Video</AlertDialogTitle>
                              <AlertDialogDescription>
                                Yakin mau hapus video "{video.title}"? Action ini tidak bisa di-undo ya cuy!
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteVideo(video.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a
                            href={`https://www.youtube.com/watch?v=${video.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Youtube className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada video yang ditambahkan.</p>
              <p className="text-sm">Tambahkan video pertama menggunakan form di atas!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
