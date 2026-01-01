'use client'

import { useEffect, useRef } from 'react'
import { incrementBlogPostViews } from '@/lib/actions'

interface BlogViewTrackerProps {
  postId: string
}

function generateSessionId(): string {
  // Generate a unique session ID for view tracking
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 10)
  return `blog-${timestamp}-${randomPart}`
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''

  const storageKey = 'vibedev-blog-session-id'
  let sessionId = sessionStorage.getItem(storageKey)

  if (!sessionId) {
    sessionId = generateSessionId()
    sessionStorage.setItem(storageKey, sessionId)
  }

  return sessionId
}

export function BlogViewTracker({ postId }: BlogViewTrackerProps) {
  const hasTracked = useRef(false)

  useEffect(() => {
    // Prevent double tracking in development (StrictMode)
    if (hasTracked.current) return
    hasTracked.current = true

    const trackView = async () => {
      try {
        const sessionId = getOrCreateSessionId()
        await incrementBlogPostViews(postId, sessionId)
      } catch (error) {
        console.error('[BlogViewTracker] Failed to track view:', error)
      }
    }

    // Small delay to ensure page is loaded
    const timeoutId = setTimeout(trackView, 500)

    return () => clearTimeout(timeoutId)
  }, [postId])

  // This component doesn't render anything
  return null
}
