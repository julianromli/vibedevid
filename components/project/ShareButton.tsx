'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'

interface ShareButtonProps {
  projectTitle: string
}

export function ShareButton({ projectTitle }: ShareButtonProps) {
  const [showShareMenu, setShowShareMenu] = useState(false)

  const handleShare = (platform: string) => {
    const url = window.location.href
    const title = projectTitle || 'Check out this project'

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            title,
          )}&url=${encodeURIComponent(url)}`,
          '_blank',
        )
        break
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            url,
          )}`,
          '_blank',
        )
        break
      case 'copy':
        navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
        break
    }
    setShowShareMenu(false)
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-full bg-transparent"
        onClick={() => setShowShareMenu(!showShareMenu)}
      >
        <Share2 className="mr-2 h-4 w-4" />
        Share Project
      </Button>

      {showShareMenu && (
        <div className="bg-background border-border absolute top-full right-0 left-0 z-10 mt-2 rounded-lg border shadow-lg">
          <div className="space-y-1 p-2">
            <button
              onClick={() => handleShare('twitter')}
              className="hover:bg-muted w-full rounded-md px-3 py-2 text-left text-sm transition-colors"
            >
              Share on Twitter
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="hover:bg-muted w-full rounded-md px-3 py-2 text-left text-sm transition-colors"
            >
              Share on LinkedIn
            </button>
            <button
              onClick={() => handleShare('copy')}
              className="hover:bg-muted w-full rounded-md px-3 py-2 text-left text-sm transition-colors"
            >
              Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
