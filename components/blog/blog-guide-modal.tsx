'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

const BLOG_GUIDE_STORAGE_KEY = 'hide_blog_editor_guide'

function getStoredGuidePreference(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage.getItem(BLOG_GUIDE_STORAGE_KEY)
  } catch {
    return null
  }
}

function setStoredGuidePreference(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(BLOG_GUIDE_STORAGE_KEY, 'true')
  } catch {}
}

const TypingAnimation = () => (
  <div className="flex justify-center items-center py-6">
    <svg
      width="120"
      height="120"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-primary"
    >
      <rect
        x="20"
        y="10"
        width="60"
        height="80"
        rx="4"
        stroke="currentColor"
        strokeWidth="2"
        fill="var(--background)"
      />
      {/* Header Image Placeholder */}
      <rect
        x="25"
        y="15"
        width="50"
        height="20"
        rx="2"
        fill="currentColor"
        opacity="0.1"
      />
      {/* Lines */}
      <line
        x1="30"
        y1="45"
        x2="70"
        y2="45"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="40"
        strokeDashoffset="40"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="40;0;0;40"
          keyTimes="0;0.1;0.9;1"
          dur="3s"
          repeatCount="indefinite"
          begin="0s"
        />
      </line>
      <line
        x1="30"
        y1="55"
        x2="65"
        y2="55"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="35"
        strokeDashoffset="35"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="35;0;0;35"
          keyTimes="0;0.1;0.9;1"
          dur="3s"
          repeatCount="indefinite"
          begin="0.3s"
        />
      </line>
      <line
        x1="30"
        y1="65"
        x2="70"
        y2="65"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="40"
        strokeDashoffset="40"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="40;0;0;40"
          keyTimes="0;0.1;0.9;1"
          dur="3s"
          repeatCount="indefinite"
          begin="0.6s"
        />
      </line>
      <line
        x1="30"
        y1="75"
        x2="50"
        y2="75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="20"
        strokeDashoffset="20"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="20;0;0;20"
          keyTimes="0;0.1;0.9;1"
          dur="3s"
          repeatCount="indefinite"
          begin="0.9s"
        />
      </line>

      {/* Cursor */}
      <line
        x1="55"
        y1="75"
        x2="55"
        y2="75"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <animate
          attributeName="opacity"
          values="0;1;0"
          dur="1s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="x1"
          values="30;55"
          dur="3s"
          repeatCount="indefinite"
          begin="0.9s"
        />
        <animate
          attributeName="x2"
          values="30;55"
          dur="3s"
          repeatCount="indefinite"
          begin="0.9s"
        />
      </line>
    </svg>
  </div>
)

export function BlogGuideModal() {
  const [open, setOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    const hasSeenGuide = getStoredGuidePreference()
    if (!hasSeenGuide) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => setOpen(true), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && dontShowAgain) {
      setStoredGuidePreference()
    }
    setOpen(newOpen)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to the Editor</DialogTitle>
          <DialogDescription>Here's a quick guide on how to create amazing posts.</DialogDescription>
        </DialogHeader>

        <TypingAnimation />

        <div className="space-y-4 text-sm">
          <div className="grid gap-2">
            <h4 className="font-medium leading-none">✨ Rich Text Editing</h4>
            <p className="text-muted-foreground">
              Type{' '}
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                /
              </kbd>{' '}
              to open the command menu. You can add headings, lists, quotes, code blocks, and more.
            </p>
          </div>

          <div className="grid gap-2">
            <h4 className="font-medium leading-none">🖼️ Adding Media</h4>
            <p className="text-muted-foreground">
              Drag and drop images directly into the editor, or use the command menu to upload. Don't forget to set a
              cover image for your post!
            </p>
          </div>

          <div className="grid gap-2">
            <h4 className="font-medium leading-none">🏷️ Tags & Categories</h4>
            <p className="text-muted-foreground">Add relevant tags to help people find your content.</p>
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between gap-4 pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <Label
              htmlFor="dont-show"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Don't show again
            </Label>
          </div>
          <Button
            type="button"
            onClick={() => handleOpenChange(false)}
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
