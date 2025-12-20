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
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { useEffect, forwardRef, useImperativeHandle } from 'react'

interface RichTextEditorProps {
  content: Record<string, any>
  onChange: (content: Record<string, any>) => void
  placeholder?: string
}

export const RichTextEditor = forwardRef<
  { getContent: () => Record<string, any> },
  RichTextEditorProps
>(function RichTextEditor(
  { content: _content, onChange, placeholder = 'Write something amazing...' },
  ref,
) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({ inline: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: { type: 'doc', content: [] },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
    editorProps: {
      attributes: {
        className:
          'prose prose-lg prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-3',
      },
    },
  })

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

  if (!editor) {
    return (
      <div className="bg-card flex min-h-[400px] items-center justify-center overflow-hidden rounded-lg border">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    )
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  return (
    <div className="bg-card overflow-hidden rounded-lg border">
      <div className="bg-muted/30 flex items-center gap-1 border-b p-2">
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

        <Button type="button" variant="ghost" size="icon-sm" onClick={addImage}>
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
})
