'use client'

import { Share2 } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ShareButtonProps {
  projectTitle: string
}

export function ShareButton({ projectTitle }: ShareButtonProps) {
  const [showShareMenu, setShowShareMenu] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  const handleShare = (platform: string) => {
    const url = window.location.href
    const title = projectTitle || 'Check out this project'

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
          '_blank',
        )
        break
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
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

      <AnimatePresence>
        {showShareMenu && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.99 }}
            transition={{
              duration: prefersReducedMotion ? 0.08 : 0.14,
              ease: [0.2, 0, 0, 1],
            }}
            className="bg-background border-border absolute top-full right-0 left-0 z-10 mt-2 origin-top rounded-lg border shadow-lg"
          >
            <div className="space-y-1 p-2">
              <button
                type="button"
                onClick={() => handleShare('twitter')}
                className="hover:bg-muted w-full rounded-md px-3 py-2 text-left text-sm transition-colors motion-reduce:transition-none"
              >
                Share on Twitter
              </button>
              <button
                type="button"
                onClick={() => handleShare('linkedin')}
                className="hover:bg-muted w-full rounded-md px-3 py-2 text-left text-sm transition-colors motion-reduce:transition-none"
              >
                Share on LinkedIn
              </button>
              <button
                type="button"
                onClick={() => handleShare('copy')}
                className="hover:bg-muted w-full rounded-md px-3 py-2 text-left text-sm transition-colors motion-reduce:transition-none"
              >
                Copy Link
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
