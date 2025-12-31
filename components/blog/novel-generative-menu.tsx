'use client'

import { useCompletion } from '@ai-sdk/react'
import { Loader2, Sparkles, Wand2 } from 'lucide-react'
import { useEditor } from 'novel'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NovelGenerativeMenuProps {
  className?: string
}

/**
 * Generative AI menu component for continuing writing
 * Shows a floating button that triggers AI to continue writing from current position
 */
export function NovelGenerativeMenu({ className }: NovelGenerativeMenuProps) {
  const { editor } = useEditor()
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const { isLoading, complete, setCompletion, stop } = useCompletion({
    api: '/api/ai/completion',
    streamProtocol: 'text',
    onFinish: (_, completion) => {
      if (!editor) return

      // Insert the completed text at the cursor position
      editor.chain().focus().insertContent(completion).run()
      setIsVisible(false)
    },
    onError: () => {
      setIsVisible(false)
    },
  })

  // Update position based on cursor location
  useEffect(() => {
    if (!editor) return

    const updatePosition = () => {
      const { state, view } = editor
      const { selection } = state
      const { from } = selection

      // Check if selection is empty (just a cursor)
      if (!selection.empty) {
        setIsVisible(false)
        return
      }

      // Get the cursor position
      const coords = view.coordsAtPos(from)
      const editorRect = view.dom.getBoundingClientRect()

      // Position the menu below and to the left of the cursor
      setPosition({
        top: coords.bottom - editorRect.top + 8,
        left: coords.left - editorRect.left,
      })
    }

    const handleFocus = () => setIsVisible(true)
    const handleBlur = () => {
      // Small delay to allow button clicks
      setTimeout(() => {
        if (!isLoading) {
          setIsVisible(false)
        }
      }, 150)
    }

    // Listen for selection changes
    editor.on('selectionUpdate', updatePosition)
    editor.on('focus', handleFocus)
    editor.on('blur', handleBlur)

    return () => {
      editor.off('selectionUpdate', updatePosition)
      editor.off('focus', handleFocus)
      editor.off('blur', handleBlur)
    }
  }, [editor, isLoading])

  const handleContinueWriting = useCallback(async () => {
    if (!editor) return

    // Get the text before the cursor to use as context
    const { state } = editor
    const { from } = state.selection

    // Get up to 1000 characters before the cursor for context
    const textBefore = state.doc.textBetween(Math.max(0, from - 1000), from, '\n')

    if (!textBefore.trim()) return

    setCompletion('')

    await complete(
      `Continue writing the following text naturally. Write 1-2 sentences that flow well from the existing content:\n\n${textBefore}`,
    )
  }, [editor, complete, setCompletion])

  const handleStop = useCallback(() => {
    stop()
    setIsVisible(false)
  }, [stop])

  if (!editor) return null

  // Only show when editor is focused and has content
  const hasContent = editor.state.doc.textContent.length > 0

  if (!isVisible || !hasContent) return null

  return (
    <div
      className={cn('absolute z-50 flex items-center gap-1 rounded-md border bg-background p-1 shadow-md', className)}
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {isLoading ? (
        <>
          <div className="flex items-center gap-2 px-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Writing...</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleStop}
            className="h-7 px-2 text-xs"
          >
            Stop
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleContinueWriting}
          className="h-7 gap-1.5 px-2 text-purple-500 text-xs hover:text-purple-600"
        >
          <Wand2 className="h-3.5 w-3.5" />
          Continue writing
        </Button>
      )}
    </div>
  )
}

/**
 * Inline generative button that appears in the slash command menu
 */
export function GenerativeCommandItem() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-purple-500/10">
        <Sparkles className="h-4 w-4 text-purple-500" />
      </div>
      <div>
        <p className="font-medium">Continue with AI</p>
        <p className="text-muted-foreground text-xs">Let AI continue your writing</p>
      </div>
    </div>
  )
}
