"use client"

import * as React from "react"
import { Heart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toggleLike, getLikeStatus } from "@/lib/actions"
import { createClient } from "@/lib/supabase/client"

export interface HeartButtonProps {
  projectId: string
  initialLikes?: number
  onLikeChange?: (likes: number, isLiked: boolean) => void
}

export function HeartButton({ projectId, initialLikes = 0, onLikeChange }: HeartButtonProps) {
  const [isLiked, setIsLiked] = React.useState(false)
  const [likes, setLikes] = React.useState(initialLikes)
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)

  React.useEffect(() => {
    const initializeLikeStatus = async () => {
      // Check authentication status
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setIsLoggedIn(!!session?.user)

      // Get current like status
      const { totalLikes, isLiked: userLiked, error } = await getLikeStatus(projectId)
      if (!error) {
        setLikes(totalLikes)
        setIsLiked(userLiked)
      }
    }

    initializeLikeStatus()

    // Listen for auth changes
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session?.user)
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        initializeLikeStatus()
      }
    })

    return () => subscription.unsubscribe()
  }, [projectId])

  const handleClick = async () => {
    if (!isLoggedIn) {
      alert("Please sign in to like projects")
      return
    }

    if (isLoading) return

    setIsLoading(true)
    setIsAnimating(true)

    const result = await toggleLike(projectId)

    if (result.error) {
      console.error("Failed to toggle like:", result.error)
      alert("Failed to update like. Please try again.")
    } else {
      const newIsLiked = result.isLiked
      const newLikes = newIsLiked ? likes + 1 : likes - 1

      setIsLiked(newIsLiked)
      setLikes(newLikes)
      onLikeChange?.(newLikes, newIsLiked)
    }

    setIsLoading(false)
    // Reset animation state
    setTimeout(() => setIsAnimating(false), 300)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center px-3 py-1 rounded-full bg-muted/50 hover:bg-muted transition-all duration-200 gap-1 ${
        isAnimating ? "scale-110" : "scale-100"
      } ${!isLoggedIn ? "opacity-75" : ""}`}
      title={!isLoggedIn ? "Sign in to like projects" : isLiked ? "Unlike this project" : "Like this project"}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Heart
          className={`h-4 w-4 transition-all duration-200 ${
            isLiked ? "text-red-500 fill-red-500 scale-110" : "text-muted-foreground hover:text-red-400"
          } ${isAnimating ? "animate-pulse" : ""}`}
        />
      )}
      <span className="text-sm font-medium text-muted-foreground">{likes}</span>
    </Button>
  )
}
