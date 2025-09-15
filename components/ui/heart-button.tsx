'use client'

import * as React from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { getLikeStatusClient, toggleLikeClient } from '@/lib/client-likes'

export interface HeartButtonProps {
  projectId: string
  initialLikes?: number
  initialIsLiked?: boolean
  isLoggedIn?: boolean
  onLikeChange?: (likes: number, isLiked: boolean) => void
  variant?: 'default' | 'with-text' | 'primary' // Added primary variant
}

export function HeartButton({
  projectId,
  initialLikes = 0,
  initialIsLiked = false,
  isLoggedIn = false,
  onLikeChange,
  variant = 'default',
}: HeartButtonProps) {
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
        const {
          totalLikes,
          isLiked: dbIsLiked,
          error,
        } = await getLikeStatusClient(projectId)

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
  }, [projectId, isLoggedIn]) // Re-sync when login status changes

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

  // Primary variant styling for prominent placement
  const isPrimary = variant === 'primary'
  const buttonVariant = 'ghost'
  const buttonClasses = isPrimary
    ? `flex items-center gap-2 transition-all duration-300 hover:scale-105 ${
        isAnimating ? 'animate-heart-beat' : ''
      } ${!isLoggedIn ? 'opacity-75' : ''}`
    : `flex items-center gap-1 transition-all duration-300 hover:scale-105 ${
        isAnimating ? '' : ''
      } ${!isLoggedIn ? 'opacity-75' : ''}`

  const heartClasses = isPrimary
    ? `h-5 w-5 transition-all duration-300 ${
        isLiked
          ? 'text-red-500 fill-red-500 animate-heart-pulse'
          : 'text-muted-foreground hover:text-red-400'
      } ${isAnimating ? 'animate-heart-beat' : ''}`
    : `h-4 w-4 transition-all duration-300 ${
        isLiked
          ? 'text-red-500 fill-red-500'
          : 'text-muted-foreground hover:text-red-400'
      } ${isAnimating ? 'animate-pulse' : ''}`

  const textClasses = isPrimary
    ? `text-sm font-semibold transition-all duration-300 ${
        isLiked ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
      }`
    : `text-sm font-medium transition-all duration-300 ${
        isLiked ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
      }`

  return (
    <>
      <Button
        variant={buttonVariant}
        size="sm"
        onClick={handleClick}
        className={buttonClasses}
        title={
          !isLoggedIn
            ? 'Sign in to like projects'
            : isLiked
              ? 'Unlike this project'
              : 'Like this project'
        }
      >
        <Heart className={heartClasses} />
        {variant === 'with-text' || variant === 'primary' ? (
          <span className={textClasses}>Like • {likes}</span>
        ) : (
          <span className={textClasses}>{likes}</span>
        )}
      </Button>

      {/* Auth Required Dialog */}
      <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Masuk untuk Memberi Like</AlertDialogTitle>
            <AlertDialogDescription>
              Kamu harus masuk untuk memberi like pada project ini. Yuk, gabung
              ke VibeDev community!
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
