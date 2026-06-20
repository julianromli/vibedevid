"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user?: {
    id?: string;
    username?: string;
    display_name?: string;
    name?: string;
    avatar_url?: string;
    avatar?: string;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackClassName?: string;
  showOnlineStatus?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-16 w-16",
  xl: "h-32 w-32",
};

const fallbackSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
  xl: "text-2xl",
};

export function UserAvatar({
  user,
  size = "md",
  className,
  fallbackClassName,
  showOnlineStatus = false,
}: UserAvatarProps) {
  const avatarUrl = user?.avatar_url || user?.avatar || "/vibedev-guest-avatar.png";

  const getInitials = () => {
    const displayName = user?.display_name || user?.name || user?.username || "";
    return (
      displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"
    );
  };

  return (
    <div className="relative">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage
          src={avatarUrl}
          alt={user?.display_name || user?.name || user?.username || "User"}
          className="object-cover"
        />
        <AvatarFallback className={cn(fallbackSizeClasses[size], fallbackClassName)}>
          {getInitials()}
        </AvatarFallback>
      </Avatar>

      {showOnlineStatus && (
        <div className="border-background absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 bg-green-500" />
      )}
    </div>
  );
}
