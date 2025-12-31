'use client'

import { useCompletion } from '@ai-sdk/react'
import { Check, ChevronDown, Loader2, RefreshCcw, Sparkles, X } from 'lucide-react'
import { EditorBubbleItem, useEditor } from 'novel'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface AICommand {
  name: string
  prompt: string
  icon?: React.ReactNode
}

const AI_COMMANDS: AICommand[] = [
  {
    name: 'Improve writing',
    prompt:
      'Improve the following text. Make it clearer, more engaging, and better structured while maintaining the original meaning:',
  },
  {
    name: 'Fix grammar',
    prompt:
      'Fix any grammar, spelling, and punctuation errors in the following text. Only fix errors, do not change the meaning or style:',
  },
  {
    name: 'Make shorter',
    prompt: 'Make the following text shorter and more concise while keeping the key information and meaning:',
  },
  {
    name: 'Make longer',
    prompt:
      'Expand the following text with more details, examples, or explanations while maintaining the same tone and style:',
  },
  {
    name: 'Translate to English',
    prompt: 'Translate the following text to English. Maintain the original tone and meaning:',
  },
]

interface AIResponsePanelProps {
  response: string
  isLoading: boolean
  onAccept: () => void
  onReject: () => void
  onRetry: () => void
}

function AIResponsePanel({ response, isLoading, onAccept, onReject, onRetry }: AIResponsePanelProps) {
  return (
    <div className="flex flex-col gap-2 border-muted border-t p-2">
      <div className="max-h-32 overflow-y-auto rounded bg-muted/50 p-2 text-sm">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating...</span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{response}</p>
        )}
      </div>
      {!isLoading && response && (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onAccept}
            className="h-7 gap-1 px-2 text-xs"
          >
            <Check className="h-3 w-3" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onReject}
            className="h-7 gap-1 px-2 text-xs"
          >
            <X className="h-3 w-3" />
            Reject
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRetry}
            className="h-7 gap-1 px-2 text-xs"
          >
            <RefreshCcw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      )}
    </div>
  )
}

export function NovelAISelector() {
  const { editor } = useEditor()
  const [isOpen, setIsOpen] = useState(false)
  const [showResponse, setShowResponse] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [lastCommand, setLastCommand] = useState<AICommand | null>(null)

  const { completion, isLoading, complete, setCompletion } = useCompletion({
    api: '/api/ai/completion',
    onFinish: () => {
      setShowResponse(true)
    },
    onError: () => {
      setCompletion('Failed to generate. Please try again.')
      setShowResponse(true)
    },
  })

  const handleCommand = useCallback(
    async (command: AICommand) => {
      if (!editor) return

      const { from, to } = editor.state.selection
      const text = editor.state.doc.textBetween(from, to, ' ')

      if (!text.trim()) return

      setSelectedText(text)
      setLastCommand(command)
      setIsOpen(false)
      setShowResponse(true)
      setCompletion('')

      await complete(`${command.prompt}\n\n${text}`)
    },
    [editor, complete, setCompletion],
  )

  const handleAccept = useCallback(() => {
    if (!editor || !completion) return

    const { from, to } = editor.state.selection

    editor.chain().focus().deleteRange({ from, to }).insertContent(completion).run()

    setShowResponse(false)
    setCompletion('')
  }, [editor, completion, setCompletion])

  const handleReject = useCallback(() => {
    setShowResponse(false)
    setCompletion('')
  }, [setCompletion])

  const handleRetry = useCallback(async () => {
    if (!lastCommand || !selectedText) return

    setCompletion('')
    await complete(`${lastCommand.prompt}\n\n${selectedText}`)
  }, [lastCommand, selectedText, complete, setCompletion])

  if (!editor) return null

  return (
    <div className="flex flex-col">
      <div className="flex items-center">
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
                className={cn('h-8 gap-1 rounded-none border-none px-2 text-purple-500', isOpen && 'bg-accent')}
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-xs">Ask AI</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </EditorBubbleItem>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-48"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {AI_COMMANDS.map((command) => (
              <DropdownMenuItem
                key={command.name}
                onSelect={() => handleCommand(command)}
                className="cursor-pointer"
              >
                {command.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {showResponse && (
        <AIResponsePanel
          response={completion}
          isLoading={isLoading}
          onAccept={handleAccept}
          onReject={handleReject}
          onRetry={handleRetry}
        />
      )}
    </div>
  )
}
