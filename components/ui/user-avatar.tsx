"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  user?: {
    id?: string
    username?: string
    display_name?: string
    name?: string
    avatar_url?: string
    avatar?: string
  }
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  fallbackClassName?: string
  showOnlineStatus?: boolean
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
  xl: "h-32 w-32",
}

const fallbackSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
  xl: "text-2xl",
}

export function UserAvatar({
  user,
  size = "md",
  className,
  fallbackClassName,
  showOnlineStatus = false,
}: UserAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadAvatar = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      const initialUrl = user.avatar_url || user.avatar || "/vibedev-guest-avatar.png"

      // If user has an ID, fetch fresh avatar from database
      if (user.id) {
        try {
          const supabase = createClient()
          const { data: profile } = await supabase.from("users").select("avatar_url").eq("id", user.id).single()

          if (profile?.avatar_url) {
            setAvatarUrl(profile.avatar_url)
          } else {
            setAvatarUrl(initialUrl)
          }
        } catch (error) {
          console.error("Error fetching avatar:", error)
          setAvatarUrl(initialUrl)
        }
      } else {
        setAvatarUrl(initialUrl)
      }

      setIsLoading(false)
    }

    loadAvatar()
  }, [user])

  // Generate fallback initials
  const getInitials = () => {
    const displayName = user?.display_name || user?.name || user?.username || ""
    return (
      displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"
    )
  }

  return (
    <div className="relative">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage
          src={avatarUrl || "/vibedev-guest-avatar.png"}
          alt={user?.display_name || user?.name || user?.username || "User"}
          className="object-cover"
        />
        <AvatarFallback className={cn(fallbackSizeClasses[size], fallbackClassName)}>
          {isLoading ? "..." : getInitials()}
        </AvatarFallback>
      </Avatar>

      {showOnlineStatus && (
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
      )}
    </div>
  )
}
