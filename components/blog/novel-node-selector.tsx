'use client'

import {
  CheckSquare,
  ChevronDown,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Text,
} from 'lucide-react'
import { EditorBubbleItem, useEditor } from 'novel'
import { useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface NodeType {
  name: string
  icon: React.ReactNode
  command: (editor: ReturnType<typeof useEditor>['editor']) => void
  isActive: (editor: ReturnType<typeof useEditor>['editor']) => boolean
}

const NODE_TYPES: NodeType[] = [
  {
    name: 'Text',
    icon: <Text className="h-4 w-4" />,
    command: (editor) => editor?.chain().focus().toggleNode('paragraph', 'paragraph').run(),
    isActive: (editor) =>
      (editor?.isActive('paragraph') ?? false) &&
      !(editor?.isActive('bulletList') ?? false) &&
      !(editor?.isActive('orderedList') ?? false),
  },
  {
    name: 'Heading 1',
    icon: <Heading1 className="h-4 w-4" />,
    command: (editor) => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (editor) => editor?.isActive('heading', { level: 1 }) ?? false,
  },
  {
    name: 'Heading 2',
    icon: <Heading2 className="h-4 w-4" />,
    command: (editor) => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (editor) => editor?.isActive('heading', { level: 2 }) ?? false,
  },
  {
    name: 'Heading 3',
    icon: <Heading3 className="h-4 w-4" />,
    command: (editor) => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (editor) => editor?.isActive('heading', { level: 3 }) ?? false,
  },
  {
    name: 'Bullet List',
    icon: <List className="h-4 w-4" />,
    command: (editor) => editor?.chain().focus().toggleBulletList().run(),
    isActive: (editor) => editor?.isActive('bulletList') ?? false,
  },
  {
    name: 'Numbered List',
    icon: <ListOrdered className="h-4 w-4" />,
    command: (editor) => editor?.chain().focus().toggleOrderedList().run(),
    isActive: (editor) => editor?.isActive('orderedList') ?? false,
  },
  {
    name: 'To-do List',
    icon: <CheckSquare className="h-4 w-4" />,
    command: (editor) => editor?.chain().focus().toggleList('taskList', 'taskItem').run(),
    isActive: (editor) => editor?.isActive('taskList') ?? false,
  },
  {
    name: 'Quote',
    icon: <Quote className="h-4 w-4" />,
    command: (editor) => editor?.chain().focus().toggleBlockquote().run(),
    isActive: (editor) => editor?.isActive('blockquote') ?? false,
  },
  {
    name: 'Code Block',
    icon: <Code className="h-4 w-4" />,
    command: (editor) => editor?.chain().focus().toggleCodeBlock().run(),
    isActive: (editor) => editor?.isActive('codeBlock') ?? false,
  },
]

interface NovelNodeSelectorProps {
  className?: string
}

/**
 * Node type selector for the bubble menu
 * Allows changing the current block type (paragraph, headings, lists, etc.)
 */
export function NovelNodeSelector({ className }: NovelNodeSelectorProps) {
  const { editor } = useEditor()
  const [isOpen, setIsOpen] = useState(false)
  // Container ref to render dropdown within bubble menu
  const containerRef = useRef<HTMLDivElement>(null)

  // Find the currently active node type
  const activeNode = useMemo(() => {
    if (!editor) return NODE_TYPES[0]
    return NODE_TYPES.find((node) => node.isActive(editor)) ?? NODE_TYPES[0]
  }, [editor])

  if (!editor) return null

  return (
    <div
      ref={containerRef}
      className={cn('relative flex items-center', className)}
    >
      <DropdownMenu
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <DropdownMenuTrigger asChild>
          <EditorBubbleItem
            onSelect={() => {
              setIsOpen(!isOpen)
            }}
          >
            <Button
              size="sm"
              variant="ghost"
              className={cn('h-8 gap-1 rounded-none border-none px-2', isOpen && 'bg-accent')}
            >
              {activeNode.icon}
              <span className="text-xs">{activeNode.name}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </EditorBubbleItem>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="bottom"
          sideOffset={4}
          container={containerRef.current}
          className="z-[99999] w-44"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {NODE_TYPES.map((node) => (
            <DropdownMenuItem
              key={node.name}
              onSelect={() => {
                node.command(editor)
                setIsOpen(false)
              }}
              className={cn('flex cursor-pointer items-center gap-2', node.isActive(editor) && 'bg-accent')}
            >
              {node.icon}
              <span>{node.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
