'use client'

import { Heart } from 'lucide-react'
import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { getLikeStatusClient, toggleLikeClient } from '@/lib/client-likes'

export interface ProminentLikeButtonProps {
  projectId: string
  initialLikes?: number
  initialIsLiked?: boolean
  isLoggedIn?: boolean
  onLikeChange?: (likes: number, isLiked: boolean) => void
}

export function ProminentLikeButton({
  projectId,
  initialLikes = 0,
  initialIsLiked = false,
  isLoggedIn = false,
  onLikeChange,
}: ProminentLikeButtonProps) {
  const [isLiked, setIsLiked] = React.useState(initialIsLiked)
  const [likes, setLikes] = React.useState(initialLikes)
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [showAuthDialog, setShowAuthDialog] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  // Sync with database on mount and when logged in status changes
  React.useEffect(() => {
    const syncLikeStatus = async () => {
      if (!projectId) return

      setIsLoading(true)
      try {
        const { totalLikes, isLiked: dbIsLiked, error } = await getLikeStatusClient(projectId)

        if (!error) {
          setLikes(totalLikes)
          setIsLiked(dbIsLiked)
        }
      } catch (error) {
        console.error('Failed to sync like status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    syncLikeStatus()
  }, [projectId, isLoggedIn])

  // Fallback to initial props if database sync fails
  React.useEffect(() => {
    if (!isLoading) {
      setIsLiked(initialIsLiked)
      setLikes(initialLikes)
    }
  }, [initialIsLiked, initialLikes, isLoading])

  const handleClick = async () => {
    if (!isLoggedIn) {
      setShowAuthDialog(true)
      return
    }

    setIsAnimating(true)

    const newIsLiked = !isLiked
    const newLikes = newIsLiked ? likes + 1 : likes - 1

    setIsLiked(newIsLiked)
    setLikes(newLikes)
    onLikeChange?.(newLikes, newIsLiked)

    try {
      const result = await toggleLikeClient(projectId)

      if (result.error) {
        setIsLiked(!newIsLiked)
        setLikes(newIsLiked ? likes - 1 : likes + 1)
        onLikeChange?.(newIsLiked ? likes - 1 : likes + 1, !newIsLiked)
      }
    } catch (error) {
      setIsLiked(!newIsLiked)
      setLikes(newIsLiked ? likes - 1 : likes + 1)
      onLikeChange?.(newIsLiked ? likes - 1 : likes + 1, !newIsLiked)
    }

    setTimeout(() => setIsAnimating(false), 300)
  }

  return (
    <>
      <Button
        className="py-0 pe-0"
        variant="default"
        onClick={handleClick}
        title={!isLoggedIn ? 'Sign in to like projects' : isLiked ? 'Unlike this project' : 'Like this project'}
      >
        <Heart
          className={`me-2 ${isLiked ? 'fill-red-500 text-red-500' : 'text-primary-foreground opacity-80'} transition-all duration-300 ${isAnimating ? 'scale-110 animate-pulse' : ''}`}
          size={16}
          strokeWidth={2}
          aria-hidden="true"
        />
        Like
        <span className="text-primary-foreground/80 before:bg-primary-foreground/20 relative ms-3 inline-flex h-full items-center justify-center rounded-full px-3 text-xs font-medium before:absolute before:inset-0 before:left-0 before:w-px">
          {likes}
        </span>
      </Button>

      {/* Auth Required Dialog */}
      <AlertDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Masuk untuk Memberi Like</AlertDialogTitle>
            <AlertDialogDescription>
              Kamu harus masuk untuk memberi like pada project ini. Yuk, gabung ke VibeDev community!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.location.href = '/user/auth'
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sign In
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
