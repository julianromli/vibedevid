'use client'

import {
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  List,
  ListOrdered,
  Quote,
  Text,
} from 'lucide-react'
import {
  EditorBubble,
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  EditorRoot,
  type JSONContent,
} from 'novel'
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useUploadThing } from '@/lib/uploadthing-client'
import { cn } from '@/lib/utils'
import { NovelAISelector } from './novel-ai-selector'
import {
  Command,
  createSuggestionItems,
  defaultExtensions,
  handleCommandNavigation,
  renderItems,
} from './novel-extensions'
import { NovelLinkSelector } from './novel-link-selector'
import { NovelNodeSelector } from './novel-node-selector'
import { NovelTextButtons } from './novel-text-buttons'

interface NovelEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
  placeholder?: string
}

interface NovelEditorHandle {
  getContent: () => Record<string, unknown>
  setContent: (content: Record<string, unknown>) => void
}

/**
 * Create slash command suggestion items for the editor
 * @param onImageUpload - Callback to trigger image upload
 */
const createEditorSuggestionItems = (onImageUpload: () => void) =>
  createSuggestionItems([
    {
      title: 'Text',
      description: 'Just start typing with plain text.',
      searchTerms: ['p', 'paragraph'],
      icon: <Text size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').run()
      },
    },
    {
      title: 'Heading 1',
      description: 'Big section heading.',
      searchTerms: ['title', 'big', 'large'],
      icon: <Heading1 size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
      },
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading.',
      searchTerms: ['subtitle', 'medium'],
      icon: <Heading2 size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
      },
    },
    {
      title: 'Heading 3',
      description: 'Small section heading.',
      searchTerms: ['subtitle', 'small'],
      icon: <Heading3 size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
      },
    },
    {
      title: 'Image',
      description: 'Upload an image from your device.',
      searchTerms: ['photo', 'picture', 'media', 'img', 'upload'],
      icon: <ImageIcon size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run()
        // Trigger file picker after closing slash command
        setTimeout(() => onImageUpload(), 100)
      },
    },
    {
      title: 'To-do List',
      description: 'Track tasks with a to-do list.',
      searchTerms: ['todo', 'task', 'list', 'check', 'checkbox'],
      icon: <CheckSquare size={18} />,
      command: ({ editor, range }) => {
        // Use toggleList with taskList type for task list functionality
        editor.chain().focus().deleteRange(range).toggleList('taskList', 'taskItem').run()
      },
    },
    {
      title: 'Bullet List',
      description: 'Create a simple bullet list.',
      searchTerms: ['unordered', 'point'],
      icon: <List size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
      },
    },
    {
      title: 'Numbered List',
      description: 'Create a list with numbering.',
      searchTerms: ['ordered'],
      icon: <ListOrdered size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run()
      },
    },
    {
      title: 'Quote',
      description: 'Capture a quote.',
      searchTerms: ['blockquote'],
      icon: <Quote size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').toggleBlockquote().run()
      },
    },
    {
      title: 'Code',
      description: 'Capture a code snippet.',
      searchTerms: ['codeblock'],
      icon: <Code size={18} />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
      },
    },
  ])

/**
 * Create slash command extension with dynamic suggestion items
 */
const createSlashCommand = (onImageUpload: () => void) =>
  Command.configure({
    suggestion: {
      items: () => createEditorSuggestionItems(onImageUpload),
      render: renderItems,
    },
  })

/**
 * Novel Editor wrapper component with forwardRef pattern
 * Provides the same interface as RichTextEditor for compatibility
 */
export const NovelEditor = forwardRef<NovelEditorHandle, NovelEditorProps>(function NovelEditor(
  { content, onChange, placeholder = 'Write something amazing... Type "/" for commands' },
  ref,
) {
  const [editorContent, setEditorContent] = useState<JSONContent | null>(null)
  // Store editor instance reference for setContent and image uploads
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorInstanceRef = useRef<any>(null)
  // Hidden file input ref for image upload via slash command
  const fileInputRef = useRef<HTMLInputElement>(null)

  // UploadThing for drag-drop/paste image handling
  const { startUpload } = useUploadThing('blogImageUploader', {
    onUploadBegin: () => {
      toast.info('Uploading image...')
    },
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl || res?.[0]?.url
      if (url && editorInstanceRef.current) {
        editorInstanceRef.current
          .chain()
          .focus()
          .insertContent({
            type: 'image',
            attrs: { src: url },
          })
          .run()
        toast.success('Image uploaded')
      }
    },
    onUploadError: (error) => {
      toast.error(`Upload failed: ${error.message}`)
    },
  })

  // Handle file selection from hidden input
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && file.type.startsWith('image/')) {
        startUpload([file])
      }
      // Reset input so same file can be selected again
      e.target.value = ''
    },
    [startUpload],
  )

  // Trigger file picker for image upload
  const triggerImageUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Create slash command with image upload callback
  const slashCommand = useMemo(() => createSlashCommand(triggerImageUpload), [triggerImageUpload])

  // Create suggestion items with image upload callback
  const suggestionItems = useMemo(() => createEditorSuggestionItems(triggerImageUpload), [triggerImageUpload])

  // Memoize initial content to prevent re-renders
  const safeContent = useMemo(() => {
    if (content && typeof content === 'object' && 'type' in content) {
      return content as JSONContent
    }
    return { type: 'doc', content: [] } as JSONContent
  }, [content])

  // Store editor content reference for getContent
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdate = useCallback(
    ({ editor }: { editor: any }) => {
      const json = editor.getJSON()
      setEditorContent(json)
      // Store editor instance for setContent and image insertion
      editorInstanceRef.current = editor
      onChange(json as Record<string, unknown>)
    },
    [onChange],
  )

  // Expose getContent and setContent via ref
  useImperativeHandle(
    ref,
    () => ({
      getContent: () => editorContent ?? safeContent ?? { type: 'doc', content: [] },
      setContent: (newContent: Record<string, unknown>) => {
        const jsonContent = newContent as JSONContent
        setEditorContent(jsonContent)
        // Update the actual editor instance if available
        if (editorInstanceRef.current) {
          editorInstanceRef.current.commands.setContent(jsonContent)
        }
      },
    }),
    [editorContent, safeContent],
  )

  // Configure extensions with placeholder - use type assertion to avoid version conflicts
  const extensions = useMemo(() => {
    const exts = [...defaultExtensions, slashCommand]
    // Configure placeholder if needed
    const placeholderIdx = exts.findIndex((ext) => ext.name === 'placeholder')
    if (placeholderIdx >= 0) {
      const result = exts.map((ext, idx) => (idx === placeholderIdx ? ext.configure({ placeholder }) : ext))
      // Type assertion to handle version conflicts between novel and @tiptap packages
      return result as typeof exts
    }
    return exts
  }, [placeholder, slashCommand])

  return (
    <div className="flex max-h-[70vh] min-h-[320px] flex-col overflow-hidden rounded-lg border bg-card md:min-h-[420px]">
      {/* Hidden file input for image upload via slash command */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        aria-hidden="true"
      />
      <EditorRoot>
        <EditorContent
          className="flex-1 overflow-y-auto"
          initialContent={safeContent}
          // Type assertion to handle version conflicts between novel and @tiptap packages
          extensions={extensions as Parameters<typeof EditorContent>[0]['extensions']}
          onUpdate={handleUpdate}
          immediatelyRender={false}
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            handleDrop: (_view, event, _slice, moved) => {
              if (!moved && event.dataTransfer?.files?.[0]) {
                const file = event.dataTransfer.files[0]
                if (file.type.startsWith('image/')) {
                  event.preventDefault()
                  toast.info('Uploading image...')
                  startUpload([file])
                  return true
                }
              }
              return false
            },
            handlePaste: (_view, event) => {
              const file = event.clipboardData?.files?.[0]
              if (file?.type.startsWith('image/')) {
                event.preventDefault()
                toast.info('Uploading image...')
                startUpload([file])
                return true
              }
              return false
            },
            attributes: {
              class: cn(
                'prose prose-lg prose-neutral dark:prose-invert max-w-none',
                'focus:outline-none px-4 py-3 min-h-full',
              ),
            },
          }}
        >
          {/* Slash Command Menu */}
          <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="px-2 text-muted-foreground">No results</EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item) => (
                <EditorCommandItem
                  key={item.title}
                  value={item.title}
                  onCommand={(val) => item.command?.(val)}
                  className="flex w-full cursor-pointer items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground text-xs">{item.description}</p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>

          {/* Bubble Menu for text selection */}
          <EditorBubble
            tippyOptions={{
              placement: 'top',
            }}
            className="flex w-fit max-w-[90vw] flex-col overflow-hidden rounded border border-muted bg-background shadow-xl"
          >
            <div className="flex items-center">
              <NovelNodeSelector />
              <div className="mx-0.5 h-6 w-px bg-muted" />
              <NovelLinkSelector />
              <div className="mx-0.5 h-6 w-px bg-muted" />
              <NovelTextButtons />
              <div className="mx-0.5 h-6 w-px bg-muted" />
              <NovelAISelector />
            </div>
          </EditorBubble>
        </EditorContent>
      </EditorRoot>
    </div>
  )
})

NovelEditor.displayName = 'NovelEditor'
