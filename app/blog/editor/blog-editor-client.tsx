'use client'

import { useState, useEffect, lazy, Suspense, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/ui/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBlogPost } from '@/lib/actions/blog'
import { toast } from 'sonner'
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

export default function BlogEditorClient({ user }: BlogEditorClientProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [saving, setSaving] = useState(false)
  const editorRef = useRef<EditorRef>(null)

  useEffect(() => {
    console.log('[BlogEditorClient] User authenticated:', user.id)
  }, [user])

  const handlePublish = useCallback(async () => {
    if (!title.trim()) {
      toast.error('Please add a title')
      return
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
        cover_image: coverImage.trim() || undefined,
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
  }, [title, excerpt, coverImage, router])

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
                disabled={saving}
              >
                Save Draft
              </Button>
              <Button onClick={handlePublish} disabled={saving}>
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

            <div className="space-y-2">
              <Label htmlFor="cover">Cover Image URL (optional)</Label>
              <Input
                id="cover"
                placeholder="https://example.com/image.jpg"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <Suspense fallback={<EditorSkeleton />}>
                <RichTextEditor
                  ref={editorRef}
                  content={{ type: 'doc', content: [] }}
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
