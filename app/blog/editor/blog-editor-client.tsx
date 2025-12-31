'use client'

import { useRouter } from 'next/navigation'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { BlogGuideModal } from '@/components/blog/blog-guide-modal'
import { CoverImageUploader } from '@/components/blog/cover-image-uploader'
import { PreviewDialog } from '@/components/blog/preview-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MultipleSelector, { type Option } from '@/components/ui/multiselect'
import { Navbar } from '@/components/ui/navbar'
import { createBlogPost, getTags, updateBlogPost } from '@/lib/actions/blog'
import type { User } from '@/types/homepage'

const NovelEditor = lazy(() =>
  import('@/components/blog/novel-editor').then((mod) => ({
    default: mod.NovelEditor,
  })),
)

function EditorSkeleton() {
  return (
    <div className="flex min-h-[400px] items-center justify-center overflow-hidden rounded-lg border bg-card">
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

export default function BlogEditorClient({ user, initialData, mode = 'create' }: BlogEditorClientProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialData?.title || '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '')
  const [coverImage, setCoverImage] = useState(initialData?.cover_image || '')
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [saving, setSaving] = useState(false)
  const editorRef = useRef<EditorRef>(null)

  // Tags state
  const [selectedTags, setSelectedTags] = useState<Option[]>(
    initialData?.tags?.map((t: string) => ({ label: t, value: t })) || [],
  )

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

      // Log content before saving for debugging
      console.log('[BlogEditorClient] Content before save:', JSON.stringify(editorContent, null, 2))

      const contentJson = JSON.stringify(editorContent)
      const minLength = status === 'draft' ? 10 : 100
      if (contentJson.length < minLength) {
        toast.error('Content is too short')
        return
      }

      setSaving(true)

      try {
        let result: any
        const postData = {
          title: title.trim(),
          excerpt: excerpt.trim() || undefined,
          content: contentJson,
          cover_image: parsedCoverImageUrl?.url || undefined,
          status,
          tags: selectedTags.map((t) => t.label),
        }

        if (mode === 'edit' && initialData?.id) {
          result = await updateBlogPost(initialData.id, postData as any)
        } else {
          result = await createBlogPost(postData)
        }

        if (result.success) {
          toast.success(status === 'published' ? 'Post published!' : 'Draft saved!')

          const finalSlug = result.slug || initialData?.slug
          console.log('[BlogEditor] Redirecting with slug:', finalSlug)

          if (mode === 'create') {
            if (status === 'published') {
              router.push(`/blog/${finalSlug}`)
            } else {
              router.push('/dashboard/posts')
            }
          } else {
            if (status === 'published') {
              router.push(`/blog/${finalSlug}`)
            }
          }
        } else {
          toast.error(result.error ?? 'Failed to save')
        }
      } catch (_error) {
        toast.error('Something went wrong')
      } finally {
        setSaving(false)
      }
    },
    [title, excerpt, coverImage, isUploadingCover, router, mode, initialData, selectedTags],
  )

  const handleEditorChange = useCallback((json: Record<string, any>) => {
    setCurrentContent(json)
  }, [])

  const handleTagSearch = async (query: string): Promise<Option[]> => {
    const tags = await getTags(query)
    return tags.map((t) => ({ label: t.name, value: t.name }))
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        isLoggedIn={true}
        user={user}
      />

      <main className="py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="font-bold text-3xl">{mode === 'edit' ? 'Edit Post' : 'Write a Post'}</h1>
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
                className="font-semibold text-lg"
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

            <div className="space-y-2">
              <Label>Tags</Label>
              <MultipleSelector
                value={selectedTags}
                onChange={setSelectedTags}
                onSearch={handleTagSearch}
                placeholder="Add tags..."
                creatable
                emptyIndicator={<p className="text-center text-muted-foreground text-sm">No tags found.</p>}
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
                <NovelEditor
                  ref={editorRef}
                  content={initialEditorContent}
                  onChange={handleEditorChange}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
      <BlogGuideModal />
    </div>
  )
}
