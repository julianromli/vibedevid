'use client'

import { Bold, Code, Italic, Strikethrough, Underline } from 'lucide-react'
import { EditorBubbleItem, useEditor } from 'novel'
import { Toggle } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'

interface TextButton {
  name: string
  icon: React.ReactNode
  isActive: (editor: ReturnType<typeof useEditor>['editor']) => boolean
  action: (editor: ReturnType<typeof useEditor>['editor']) => void
}

const TEXT_BUTTONS: TextButton[] = [
  {
    name: 'Bold',
    icon: <Bold className="h-4 w-4" />,
    isActive: (editor) => editor?.isActive('bold') ?? false,
    action: (editor) => editor?.chain().focus().toggleBold().run(),
  },
  {
    name: 'Italic',
    icon: <Italic className="h-4 w-4" />,
    isActive: (editor) => editor?.isActive('italic') ?? false,
    action: (editor) => editor?.chain().focus().toggleItalic().run(),
  },
  {
    name: 'Underline',
    icon: <Underline className="h-4 w-4" />,
    isActive: (editor) => editor?.isActive('underline') ?? false,
    action: (editor) => editor?.chain().focus().toggleUnderline().run(),
  },
  {
    name: 'Strikethrough',
    icon: <Strikethrough className="h-4 w-4" />,
    isActive: (editor) => editor?.isActive('strike') ?? false,
    action: (editor) => editor?.chain().focus().toggleStrike().run(),
  },
  {
    name: 'Code',
    icon: <Code className="h-4 w-4" />,
    isActive: (editor) => editor?.isActive('code') ?? false,
    action: (editor) => editor?.chain().focus().toggleCode().run(),
  },
]

interface NovelTextButtonsProps {
  className?: string
}

/**
 * Text formatting buttons for the bubble menu
 * Includes Bold, Italic, Underline, Strikethrough, and Code
 */
export function NovelTextButtons({ className }: NovelTextButtonsProps) {
  const { editor } = useEditor()

  if (!editor) return null

  return (
    <div className={cn('flex items-center', className)}>
      {TEXT_BUTTONS.map((button) => (
        <EditorBubbleItem
          key={button.name}
          onSelect={() => button.action(editor)}
        >
          <Toggle
            size="sm"
            pressed={button.isActive(editor)}
            className="rounded-none border-none"
            aria-label={button.name}
          >
            {button.icon}
          </Toggle>
        </EditorBubbleItem>
      ))}
    </div>
  )
}
