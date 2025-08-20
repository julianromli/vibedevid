"use client"

import * as React from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface HeartButtonProps {
  initialLikes?: number
  onLikeChange?: (likes: number, isLiked: boolean) => void
}

export function HeartButton({ initialLikes = 0, onLikeChange }: HeartButtonProps) {
  const [isLiked, setIsLiked] = React.useState(false)
  const [likes, setLikes] = React.useState(initialLikes)
  const [isAnimating, setIsAnimating] = React.useState(false)

  const handleClick = () => {
    const newIsLiked = !isLiked
    const newLikes = newIsLiked ? likes + 1 : likes - 1

    setIsLiked(newIsLiked)
    setLikes(newLikes)
    setIsAnimating(true)

    // Reset animation state
    setTimeout(() => setIsAnimating(false), 300)

    onLikeChange?.(newLikes, newIsLiked)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`flex items-center px-3 py-1 rounded-full bg-muted/50 hover:bg-muted transition-all duration-200 gap-1 ${
        isAnimating ? "scale-110" : "scale-100"
      }`}
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
