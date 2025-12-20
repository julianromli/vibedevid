'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
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
import { EditorImageUploader } from '@/components/blog/editor-image-uploader'

interface RichTextEditorProps {
  content: Record<string, any>
  onChange: (content: Record<string, any>) => void
  placeholder?: string
}

interface RichTextEditorHandle {
  getContent: () => Record<string, any>
  setContent: (content: Record<string, any>) => void
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

  const safeContent = useMemo(() => {
    if (content && typeof content === 'object' && 'type' in content) {
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
  }, [])

  const insertImageUrl = useCallback(
    (url: string) => {
      if (!editor) return
      editor.chain().focus().setImage({ src: url }).run()
    },
    [editor],
  )

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

            <EditorImageUploader
              value={imageUrl}
              onChange={setImageUrl}
              isUploading={isUploadingImage}
              onUploadStart={() => setIsUploadingImage(true)}
              onUploadComplete={(url) => {
                setIsUploadingImage(false)
                insertImageUrl(url)
                closeImageDialog()
              }}
              onUploadError={(error: Error) => {
                setIsUploadingImage(false)
                toast.error(`Upload failed: ${error.message}`)
              }}
              onInsert={() => {
                if (imageUrl.trim()) {
                  insertImageUrl(imageUrl)
                  closeImageDialog()
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
})
