'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { UploadButton } from '@uploadthing/react'
import {
  Bold,
  Italic,
  Code,
  Image as ImageIcon,
  List,
  ListOrdered,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Toggle } from '@/components/ui/toggle'
import type { OurFileRouter } from '@/lib/uploadthing'

interface RichTextEditorProps {
  content: Record<string, any>
  onChange: (content: Record<string, any>) => void
  placeholder?: string
}

interface RichTextEditorHandle {
  getContent: () => Record<string, any>
  setContent: (content: Record<string, any>) => void
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

export const RichTextEditor = forwardRef<
  RichTextEditorHandle,
  RichTextEditorProps
>(function RichTextEditor(
  { content, onChange, placeholder = 'Write something amazing...' },
  ref,
) {
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const imageUploadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const safeContent = useMemo(() => {
    if (content && typeof content === 'object' && (content as any).type) {
      return content
    }

    return { type: 'doc', content: [] }
  }, [content])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({ inline: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: safeContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-lg prose-neutral dark:prose-invert max-w-none focus:outline-none px-4 py-3 min-h-full',
      },
    },
  })

  useEffect(() => {
    if (!editor) return

    const current = editor.getJSON()
    if (JSON.stringify(current) !== JSON.stringify(safeContent)) {
      editor.commands.setContent(safeContent, { emitUpdate: false })
    }
  }, [editor, safeContent])

  useImperativeHandle(
    ref,
    () => ({
      getContent: () => editor?.getJSON() ?? { type: 'doc', content: [] },
      setContent: (newContent: Record<string, any>) => {
        if (editor && newContent) {
          editor.commands.setContent(newContent)
        }
      },
    }),
    [editor],
  )

  const closeImageDialog = useCallback(() => {
    setIsImageDialogOpen(false)
    setImageUrl('')
    setIsUploadingImage(false)

    if (imageUploadTimeout.current) {
      clearTimeout(imageUploadTimeout.current)
      imageUploadTimeout.current = null
    }
  }, [])

  const insertImageUrl = useCallback(
    (url: string) => {
      if (!editor) return
      editor.chain().focus().setImage({ src: url }).run()
    },
    [editor],
  )

  const handleInsertFromUrl = useCallback(() => {
    const trimmed = imageUrl.trim()
    const parsed = trimmed ? parseHttpOrHttpsUrl(trimmed) : null

    if (!parsed) {
      toast.error('Image URL must be http(s)')
      return
    }

    if (parsed.isHttp) {
      toast.info('Image uses http:// and may fail to load on HTTPS')
    }

    insertImageUrl(parsed.url)
    closeImageDialog()
  }, [closeImageDialog, imageUrl, insertImageUrl])

  if (!editor) {
    return (
      <div className="bg-card flex min-h-[320px] items-center justify-center overflow-hidden rounded-lg border md:min-h-[420px]">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="bg-card flex max-h-[70vh] min-h-[320px] flex-col overflow-hidden rounded-lg border md:min-h-[420px]">
      <div className="bg-muted/30 flex flex-shrink-0 items-center gap-1 border-b p-2">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('code')}
          onPressedChange={() => editor.chain().focus().toggleCode().run()}
          aria-label="Code"
        >
          <Code className="h-4 w-4" />
        </Toggle>

        <div className="bg-border mx-1 h-6 w-px" />

        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          aria-label="Bullet list"
        >
          <List className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
          aria-label="Ordered list"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>

        <div className="bg-border mx-1 h-6 w-px" />

        <Dialog
          open={isImageDialogOpen}
          onOpenChange={(open) => {
            if (open) {
              setIsImageDialogOpen(true)
              return
            }

            closeImageDialog()
          }}
        >
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm">
              <ImageIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert image</DialogTitle>
              <DialogDescription>
                Paste an image URL or upload a file (max 4MB).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="blog-editor-image-url">Image URL</Label>
                <Input
                  id="blog-editor-image-url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={isUploadingImage}
                />
              </div>

              <DialogFooter className="sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeImageDialog}
                  disabled={isUploadingImage}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleInsertFromUrl}
                  disabled={isUploadingImage || !imageUrl.trim()}
                >
                  Insert
                </Button>
              </DialogFooter>

              <div className="space-y-2 border-t pt-4">
                <Label>Upload</Label>
                <UploadButton<OurFileRouter, 'blogImageUploader'>
                  endpoint="blogImageUploader"
                  onUploadBegin={() => {
                    setIsUploadingImage(true)

                    if (imageUploadTimeout.current) {
                      clearTimeout(imageUploadTimeout.current)
                    }

                    imageUploadTimeout.current = setTimeout(() => {
                      setIsUploadingImage(false)
                      toast.error('Upload timed out. Please try again.')
                    }, 120000)
                  }}
                  onClientUploadComplete={(res) => {
                    if (imageUploadTimeout.current) {
                      clearTimeout(imageUploadTimeout.current)
                      imageUploadTimeout.current = null
                    }

                    setIsUploadingImage(false)

                    const url = getFirstUploadUrl(res)
                    if (!url) {
                      toast.error('Upload completed but no URL received')
                      return
                    }

                    insertImageUrl(url)
                    closeImageDialog()
                  }}
                  onUploadError={(error: Error) => {
                    if (imageUploadTimeout.current) {
                      clearTimeout(imageUploadTimeout.current)
                      imageUploadTimeout.current = null
                    }

                    setIsUploadingImage(false)
                    toast.error(`Upload failed: ${error.message}`)
                  }}
                  config={{ mode: 'auto' }}
                  content={{
                    button({ ready }) {
                      if (isUploadingImage) return <div>Uploading...</div>
                      if (ready) return <div>Choose file</div>
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
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
})
