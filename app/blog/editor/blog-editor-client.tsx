'use client'

import { useRouter } from 'next/navigation'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CoverImageUploader } from '@/components/blog/cover-image-uploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Navbar } from '@/components/ui/navbar'
import { createBlogPost, updateBlogPost } from '@/lib/actions/blog'
import type { User } from '@/types/homepage'

const RichTextEditor = lazy(() =>
  import('@/components/blog/rich-text-editor').then((mod) => ({
    default: mod.RichTextEditor,
  })),
)

function EditorSkeleton() {
  return (
    <div className="bg-card flex min-h-[400px] items-center justify-center overflow-hidden rounded-lg border">
      <div className="text-muted-foreground">Loading editor...</div>
    </div>
  )
}

interface EditorRef {
  getContent: () => Record<string, any>
  setContent: (content: Record<string, any>) => void
}

interface BlogEditorClientProps {
  user: User
  initialData?: any
  mode?: 'create' | 'edit'
}

function parseHttpOrHttpsUrl(rawUrl: string): { url: string; isHttp: boolean } | null {
  try {
    const parsed = new URL(rawUrl)

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }

    return { url: parsed.toString(), isHttp: parsed.protocol === 'http:' }
  } catch {
    return null
  }
}

import { PreviewDialog } from '@/components/blog/preview-dialog'

export default function BlogEditorClient({ user, initialData, mode = 'create' }: BlogEditorClientProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialData?.title || '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '')
  const [coverImage, setCoverImage] = useState(initialData?.cover_image || '')
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [saving, setSaving] = useState(false)
  const editorRef = useRef<EditorRef>(null)

  // Memoize content for preview
  const [currentContent, setCurrentContent] = useState<any>(initialData?.content || { type: 'doc', content: [] })

  const initialEditorContent = useMemo(
    () => initialData?.content || ({ type: 'doc', content: [] } as Record<string, any>),
    [initialData],
  )

  useEffect(() => {
    console.log('[BlogEditorClient] User authenticated:', user.id)
  }, [user])

  const handleSave = useCallback(
    async (status: 'published' | 'draft') => {
      if (!title.trim()) {
        toast.error('Please add a title')
        return
      }

      if (isUploadingCover) {
        toast.error('Please wait for cover upload to finish')
        return
      }

      const trimmedCoverImage = coverImage.trim()
      const parsedCoverImageUrl = trimmedCoverImage ? parseHttpOrHttpsUrl(trimmedCoverImage) : null

      if (trimmedCoverImage && !parsedCoverImageUrl) {
        toast.error('Cover image URL must be http(s)')
        return
      }

      if (parsedCoverImageUrl?.isHttp) {
        toast.info('Cover image uses http:// and may fail to load on HTTPS')
      }

      const editorContent = editorRef.current?.getContent() ?? {
        type: 'doc',
        content: [],
      }

      const contentStr = JSON.stringify(editorContent)
      const minLength = status === 'draft' ? 10 : 100
      if (contentStr.length < minLength) {
        toast.error('Content is too short')
        return
      }

      setSaving(true)

      try {
        let result
        const postData = {
          title: title.trim(),
          excerpt: excerpt.trim() || undefined,
          content: editorContent,
          cover_image: parsedCoverImageUrl?.url || undefined,
          status,
        }

        if (mode === 'edit' && initialData?.id) {
          result = await updateBlogPost(initialData.id, postData as any)
        } else {
          result = await createBlogPost(postData)
        }

        if (result.success) {
          toast.success(status === 'published' ? 'Post published!' : 'Draft saved!')
          if (mode === 'create') {
            // If created draft, go to edit mode or dashboard. If published, view it.
            if (status === 'published') {
              router.push(`/blog/${(result as any).slug}`)
            } else {
              router.push('/dashboard/posts')
            }
          } else {
            if (status === 'published') {
              router.push(`/blog/${initialData?.slug || (result as any).slug}`)
            } else {
              // Stay on page or show success
            }
          }
        } else {
          toast.error(result.error ?? 'Failed to save')
        }
      } catch {
        toast.error('Something went wrong')
      } finally {
        setSaving(false)
      }
    },
    [title, excerpt, coverImage, isUploadingCover, router, mode, initialData],
  )

  const handleEditorChange = useCallback(() => {
    if (editorRef.current) {
      setCurrentContent(editorRef.current.getContent())
    }
  }, [])

  return (
    <div className="bg-background min-h-screen">
      <Navbar
        isLoggedIn={true}
        user={user}
      />

      <main className="py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold">{mode === 'edit' ? 'Edit Post' : 'Write a Post'}</h1>
            <div className="flex gap-3">
              <PreviewDialog
                post={{
                  title,
                  excerpt,
                  cover_image: coverImage,
                  content: currentContent,
                  author: {
                    display_name: user.name,
                    avatar_url: user.avatar,
                  },
                }}
              />
              <Button
                variant="outline"
                onClick={() => handleSave('draft')}
                disabled={saving || isUploadingCover}
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                onClick={() => handleSave('published')}
                disabled={saving || isUploadingCover}
              >
                {saving ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          </div>

          <div
            className="space-y-6"
            data-editor
          >
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Give your post a catchy title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt (optional)</Label>
              <Input
                id="excerpt"
                placeholder="A brief summary of your post"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </div>

            <CoverImageUploader
              value={coverImage}
              onChange={setCoverImage}
              isUploading={isUploadingCover}
              onUploadStart={() => setIsUploadingCover(true)}
              onUploadComplete={(url) => {
                setIsUploadingCover(false)
                setCoverImage(url)
                toast.success('Cover image uploaded')
              }}
              onUploadError={(error: Error) => {
                setIsUploadingCover(false)
                toast.error(`Upload failed: ${error.message}`)
              }}
              disabled={saving}
            />

            <div className="space-y-2">
              <Label>Content</Label>
              <Suspense fallback={<EditorSkeleton />}>
                <RichTextEditor
                  ref={editorRef}
                  content={initialEditorContent}
                  onChange={handleEditorChange}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
