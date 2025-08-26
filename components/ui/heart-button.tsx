"use client"

import * as React from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toggleLike } from "@/lib/actions"

export interface HeartButtonProps {
  projectId: string
  initialLikes?: number
  initialIsLiked?: boolean
  isLoggedIn?: boolean
  onLikeChange?: (likes: number, isLiked: boolean) => void
}

export function HeartButton({
  projectId,
  initialLikes = 0,
  initialIsLiked = false,
  isLoggedIn = false,
  onLikeChange,
}: HeartButtonProps) {
  const [isLiked, setIsLiked] = React.useState(initialIsLiked)
  const [likes, setLikes] = React.useState(initialLikes)
  const [isAnimating, setIsAnimating] = React.useState(false)

  React.useEffect(() => {
    setIsLiked(initialIsLiked)
    setLikes(initialLikes)
  }, [initialIsLiked, initialLikes])

  const handleClick = async () => {
    if (!isLoggedIn) {
      alert("Please sign in to like projects")
      return
    }

    setIsAnimating(true)

    const newIsLiked = !isLiked
    const newLikes = newIsLiked ? likes + 1 : likes - 1

    setIsLiked(newIsLiked)
    setLikes(newLikes)
    onLikeChange?.(newLikes, newIsLiked)

    try {
      const result = await toggleLike(projectId)

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
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`flex items-center px-3 py-1 rounded-full bg-muted/50 hover:bg-muted transition-all duration-200 gap-1 ${
        isAnimating ? "scale-110" : "scale-100"
      } ${!isLoggedIn ? "opacity-75" : ""}`}
      title={!isLoggedIn ? "Sign in to like projects" : isLiked ? "Unlike this project" : "Like this project"}
    >
      <Heart
        className={`h-4 w-4 transition-all duration-200 ${
          isLiked ? "text-red-500 fill-red-500 scale-110" : "text-muted-foreground hover:text-red-400"
        } ${isAnimating ? "animate-pulse" : ""}`}
      />
      <span className="text-sm font-medium text-muted-foreground">{likes}</span>
    </Button>
  )
}
