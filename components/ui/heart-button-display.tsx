"use client"

import * as React from "react"
import { Heart } from "lucide-react"

export interface HeartButtonDisplayProps {
  likes: number
  variant?: "default" | "with-text" | "primary"
  className?: string
}

export function HeartButtonDisplay({
  likes = 0,
  variant = "default",
  className = "",
}: HeartButtonDisplayProps) {
  // Display-only component, no interaction states
  const isPrimary = variant === "primary"
  
  const containerClasses = isPrimary
    ? `flex items-center gap-2 ${className}`
    : `flex items-center gap-1 ${className}`

  const heartClasses = isPrimary
    ? "h-5 w-5 text-muted-foreground"
    : "h-4 w-4 text-muted-foreground"

  const textClasses = isPrimary
    ? "text-sm font-semibold text-muted-foreground"
    : "text-sm font-medium text-muted-foreground"

  return (
    <div className={containerClasses}>
      <Heart className={heartClasses} />
      {variant === "with-text" || variant === "primary" ? (
        <span className={textClasses}>
          {likes} Likes
        </span>
      ) : (
        <span className={textClasses}>
          {likes}
        </span>
      )}
    </div>
  )
}
