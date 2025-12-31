'use client'

import { PenSquare } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface FloatingWriteButtonProps {
  /** Whether the user is logged in */
  isLoggedIn: boolean
}

/**
 * Floating Action Button (FAB) for writing blog posts.
 * Only visible for logged-in users.
 * Positioned at bottom-right of the screen.
 */
export function FloatingWriteButton({ isLoggedIn }: FloatingWriteButtonProps) {
  if (!isLoggedIn) {
    return null
  }

  return (
    <motion.div
      className="fixed right-6 bottom-6 z-50 md:right-8 md:bottom-8"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay: 0.3,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Link href="/blog/editor">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg transition-shadow hover:shadow-xl"
          aria-label="Write a post"
        >
          <PenSquare className="h-6 w-6" />
          <span className="sr-only">Write a post</span>
        </Button>
      </Link>
    </motion.div>
  )
}
