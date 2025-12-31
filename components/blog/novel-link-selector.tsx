'use client'

import { Check, Link, Trash, X } from 'lucide-react'
import { EditorBubbleItem, useEditor } from 'novel'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NovelLinkSelectorProps {
  className?: string
}

/**
 * Link selector component for the bubble menu
 * Allows setting and removing links on selected text
 */
export function NovelLinkSelector({ className }: NovelLinkSelectorProps) {
  const { editor } = useEditor()
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState('')

  // Check if current selection has a link
  const isActive = editor?.isActive('link') ?? false

  // Get current link URL when selection changes
  useEffect(() => {
    if (!editor) return

    const updateLinkState = () => {
      const attrs = editor.getAttributes('link')
      if (attrs.href) {
        setUrl(attrs.href)
      } else {
        setUrl('')
      }
    }

    editor.on('selectionUpdate', updateLinkState)
    updateLinkState()

    return () => {
      editor.off('selectionUpdate', updateLinkState)
    }
  }, [editor])

  const handleSetLink = useCallback(() => {
    if (!editor || !url.trim()) return

    // Add https:// if no protocol is specified
    let finalUrl = url.trim()
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run()

    setIsOpen(false)
  }, [editor, url])

  const handleUnsetLink = useCallback(() => {
    if (!editor) return

    editor.chain().focus().unsetLink().run()
    setUrl('')
    setIsOpen(false)
  }, [editor])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSetLink()
      } else if (e.key === 'Escape') {
        setIsOpen(false)
      }
    },
    [handleSetLink],
  )

  if (!editor) return null

  return (
    <div className={cn('relative flex items-center', className)}>
      <EditorBubbleItem
        onSelect={() => {
          setIsOpen(!isOpen)
        }}
      >
        <Button
          size="sm"
          variant="ghost"
          className={cn('h-8 gap-1 rounded-none border-none px-2', isActive && 'text-blue-500', isOpen && 'bg-accent')}
        >
          <Link className="h-4 w-4" />
        </Button>
      </EditorBubbleItem>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 flex items-center gap-1 rounded-md border bg-background p-1 shadow-md">
          <input
            type="url"
            placeholder="Enter URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 w-48 rounded border-none bg-muted/50 px-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleSetLink}
            disabled={!url.trim()}
            className="h-7 w-7"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          {isActive && (
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={handleUnsetLink}
              className="h-7 w-7 text-destructive hover:text-destructive"
            >
              <Trash className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="h-7 w-7"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
