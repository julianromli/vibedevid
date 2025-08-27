"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"

interface OptimizedAvatarProps {
  src?: string | null
  alt: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  fallbackSrc?: string
  className?: string
  isGuest?: boolean
  showSkeleton?: boolean
}

const sizeClasses = {
  xs: "w-6 h-6",
  sm: "w-8 h-8", 
  md: "w-10 h-10",
  lg: "w-12 h-12",
  xl: "w-16 h-16"
}

export function OptimizedAvatar({ 
  src, 
  alt, 
  size = "md", 
  fallbackSrc = "/placeholder.svg",
  className,
  isGuest = false,
  showSkeleton = true
}: OptimizedAvatarProps) {
  const [imageState, setImageState] = useState<"loading" | "loaded" | "error">("loading")
  const [imageSrc, setImageSrc] = useState<string | null>(src)

  // Handle image load success
  const handleLoad = useCallback(() => {
    setImageState("loaded")
  }, [])

  // Handle image load error with fallback chain
  const handleError = useCallback(() => {
    if (imageSrc !== fallbackSrc) {
      // Try fallback first
      setImageSrc(fallbackSrc)
    } else {
      // If fallback also fails, set to error state
      setImageState("error")
    }
  }, [imageSrc, fallbackSrc])

  // Determine final src
  const finalSrc = isGuest 
    ? "/vibedev-guest-avatar.png" 
    : imageSrc || fallbackSrc

  const avatarClasses = cn(
    "rounded-full object-cover",
    "transition-all duration-300 ease-in-out",
    sizeClasses[size],
    {
      "opacity-0": imageState === "loading" && showSkeleton,
      "opacity-100": imageState === "loaded" || !showSkeleton,
      "bg-muted animate-pulse": imageState === "loading" && showSkeleton,
    },
    className
  )

  return (
    <div className={cn("relative overflow-hidden rounded-full", sizeClasses[size])}>
      {/* Skeleton Loading State */}
      {imageState === "loading" && showSkeleton && (
        <div 
          className={cn(
            "absolute inset-0 bg-muted animate-pulse rounded-full",
            "flex items-center justify-center"
          )}
        >
          <div className="w-1/2 h-1/2 bg-muted-foreground/20 rounded-full" />
        </div>
      )}

      {/* Actual Image */}
      <img
        src={finalSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={avatarClasses}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          // Prevent layout shift
          aspectRatio: "1 / 1",
        }}
      />

      {/* Error State Fallback */}
      {imageState === "error" && (
        <div 
          className={cn(
            "absolute inset-0 bg-muted rounded-full",
            "flex items-center justify-center text-muted-foreground"
          )}
        >
          <svg 
            className="w-1/2 h-1/2" 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
      )}
    </div>
  )
}
