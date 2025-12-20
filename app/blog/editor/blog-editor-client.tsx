'use client'

import {
  useState,
  useEffect,
  lazy,
  Suspense,
  useRef,
  useCallback,
  useMemo,
} from 'react'
import { useRouter } from 'next/navigation'
import { UploadButton } from '@uploadthing/react'
import { toast } from 'sonner'

import { Navbar } from '@/components/ui/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBlogPost } from '@/lib/actions/blog'
import type { OurFileRouter } from '@/lib/uploadthing'
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
}

function parseHttpOrHttpsUrl(
  rawUrl: string,
): { url: string; isHttp: boolean } | null {
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

function getFirstUploadUrl(res: unknown): string | null {
  if (!Array.isArray(res) || res.length === 0) return null

  const first = res[0]
  if (!first || typeof first !== 'object') return null

  const record = first as Record<string, unknown>
  const ufsUrl = record.ufsUrl
  if (typeof ufsUrl === 'string') return ufsUrl

  const url = record.url
  if (typeof url === 'string') return url

  return null
}

export default function BlogEditorClient({ user }: BlogEditorClientProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [saving, setSaving] = useState(false)
  const editorRef = useRef<EditorRef>(null)
  const coverUploadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const initialEditorContent = useMemo(
    () => ({ type: 'doc', content: [] }) as Record<string, any>,
    [],
  )

  useEffect(() => {
    console.log('[BlogEditorClient] User authenticated:', user.id)
  }, [user])

  const handlePublish = useCallback(async () => {
    if (!title.trim()) {
      toast.error('Please add a title')
      return
    }

    if (isUploadingCover) {
      toast.error('Please wait for cover upload to finish')
      return
    }

    const trimmedCoverImage = coverImage.trim()
    const parsedCoverImageUrl = trimmedCoverImage
      ? parseHttpOrHttpsUrl(trimmedCoverImage)
      : null

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
    if (contentStr.length < 100) {
      toast.error('Content is too short')
      return
    }

    setSaving(true)

    try {
      const result = await createBlogPost({
        title: title.trim(),
        excerpt: excerpt.trim() || undefined,
        content: editorContent,
        cover_image: parsedCoverImageUrl?.url || undefined,
      })

      if (result.success) {
        toast.success('Post published!')
        router.push(`/blog/${result.slug}`)
      } else {
        toast.error(result.error ?? 'Failed to publish')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }, [title, excerpt, coverImage, isUploadingCover, router])

  const handleSaveDraft = useCallback(async () => {
    toast.info('Draft saved (not implemented yet)')
  }, [])

  return (
    <div className="bg-background min-h-screen">
      <Navbar isLoggedIn={true} user={user} />

      <main className="py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="font-serif text-3xl font-bold">Write a Post</h1>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saving || isUploadingCover}
              >
                Save Draft
              </Button>
              <Button
                onClick={handlePublish}
                disabled={saving || isUploadingCover}
              >
                {saving ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          </div>

          <div className="space-y-6" data-editor>
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

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="cover">Cover Image (optional)</Label>
                {coverImage.trim() ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCoverImage('')}
                    disabled={saving || isUploadingCover}
                  >
                    Clear
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <Input
                  id="cover"
                  placeholder="https://example.com/image.jpg"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                />

                <UploadButton<OurFileRouter, 'blogImageUploader'>
                  endpoint="blogImageUploader"
                  onUploadBegin={() => {
                    setIsUploadingCover(true)

                    if (coverUploadTimeout.current) {
                      clearTimeout(coverUploadTimeout.current)
                    }

                    coverUploadTimeout.current = setTimeout(() => {
                      setIsUploadingCover(false)
                      toast.error('Cover upload timed out. Please try again.')
                    }, 120000)
                  }}
                  onClientUploadComplete={(res) => {
                    if (coverUploadTimeout.current) {
                      clearTimeout(coverUploadTimeout.current)
                      coverUploadTimeout.current = null
                    }

                    setIsUploadingCover(false)

                    const url = getFirstUploadUrl(res)
                    if (url) {
                      setCoverImage(url)
                      toast.success('Cover image uploaded')
                    } else {
                      toast.error('Upload completed but no URL received')
                    }
                  }}
                  onUploadError={(error: Error) => {
                    if (coverUploadTimeout.current) {
                      clearTimeout(coverUploadTimeout.current)
                      coverUploadTimeout.current = null
                    }

                    setIsUploadingCover(false)
                    toast.error(`Upload failed: ${error.message}`)
                  }}
                  config={{ mode: 'auto' }}
                  content={{
                    button({ ready }) {
                      if (isUploadingCover) return <div>Uploading...</div>
                      if (ready) return <div>Upload</div>
                      return 'Getting ready...'
                    },
                    allowedContent({ ready, fileTypes, isUploading }) {
                      if (!ready) return 'Checking what you allow'
                      if (isUploading) return 'Uploading...'
                      return `Image (${fileTypes.join(', ')})`
                    },
                  }}
                  appearance={{
                    button:
                      'bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md',
                    allowedContent: 'text-sm text-muted-foreground mt-2',
                  }}
                />
              </div>

              <p className="text-muted-foreground text-sm">
                Paste an image URL or upload a file (max 4MB).
              </p>

              {coverImage.trim() ? (
                <div className="overflow-hidden rounded-lg border">
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="h-48 w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <Suspense fallback={<EditorSkeleton />}>
                <RichTextEditor
                  ref={editorRef}
                  content={initialEditorContent}
                  onChange={() => {}}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
