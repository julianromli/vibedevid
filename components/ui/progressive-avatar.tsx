'use client'

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { ProgressiveImage } from './progressive-image'
import type { ProgressiveImageProps } from './progressive-image'

interface ProgressiveAvatarProps {
  src?: string | null
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  fallbackSrc?: string
  className?: string
  isGuest?: boolean
  showSkeleton?: boolean

  // Enhanced progressive loading props
  enableBlurPlaceholder?: boolean
  customBlurDataURL?: string
  placeholderColor?: string
  fadeTransition?: boolean
  transitionDuration?: number

  // Avatar-specific props
  rounded?: boolean
  border?: boolean
  borderColor?: string

  // Callbacks
  onLoadingStateChange?: (state: 'loading' | 'loaded' | 'error') => void
  onClick?: () => void
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-20 h-20',
}

const sizePx = {
  xs: { width: 24, height: 24 },
  sm: { width: 32, height: 32 },
  md: { width: 40, height: 40 },
  lg: { width: 48, height: 48 },
  xl: { width: 64, height: 64 },
  '2xl': { width: 80, height: 80 },
}

export function ProgressiveAvatar({
  src,
  alt,
  size = 'md',
  fallbackSrc = '/placeholder.svg',
  className,
  isGuest = false,
  showSkeleton = true,

  // Progressive props
  enableBlurPlaceholder = true,
  customBlurDataURL,
  placeholderColor,
  fadeTransition = true,
  transitionDuration = 300,

  // Avatar-specific
  rounded = true,
  border = false,
  borderColor = 'border-gray-200 dark:border-gray-700',

  // Callbacks
  onLoadingStateChange,
  onClick,
}: ProgressiveAvatarProps) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>(
    'loading',
  )

  // Handle loading state changes
  const handleLoadingStateChange = useCallback(
    (state: 'loading' | 'loaded' | 'error') => {
      setImageState(state)
      onLoadingStateChange?.(state)
    },
    [onLoadingStateChange],
  )

  // Determine final src with guest handling
  const finalSrc = useMemo(() => {
    if (isGuest) return '/vibedev-guest-avatar.png'
    return src || fallbackSrc
  }, [src, fallbackSrc, isGuest])

  // Get size dimensions
  const dimensions = sizePx[size]

  // Generate avatar-specific placeholder color
  const avatarPlaceholderColor = useMemo(() => {
    if (placeholderColor) return placeholderColor

    // Generate color based on alt text for consistent avatar colors
    let hash = 0
    for (let i = 0; i < alt.length; i++) {
      const char = alt.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }

    // Generate a pleasant avatar color
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 45%, 75%)`
  }, [placeholderColor, alt])

  // Avatar container classes
  const avatarClasses = cn(
    'relative overflow-hidden',
    sizeClasses[size],
    {
      'rounded-full': rounded,
      'rounded-lg': !rounded,
      [borderColor]: border,
      'border-2': border,
      'cursor-pointer hover:opacity-90 transition-opacity': onClick,
    },
    className,
  )

  // Create progressive image props
  const progressiveImageProps: ProgressiveImageProps = {
    src: finalSrc,
    alt: alt,
    width: dimensions.width,
    height: dimensions.height,
    className: cn('object-cover', {
      'rounded-full': rounded,
      'rounded-lg': !rounded,
    }),
    enableBlurPlaceholder,
    customBlurDataURL,
    placeholderColor: avatarPlaceholderColor,
    showSkeleton,
    fadeTransition,
    transitionDuration,
    fallbackSrc,
    onLoadingStateChange: handleLoadingStateChange,
    priority: false, // Avatars are typically not above the fold
    loading: 'lazy',
    quality: 85, // Higher quality for avatars since they're usually small
    unoptimized: false,
  }

  return (
    <div className={avatarClasses} onClick={onClick}>
      <ProgressiveImage {...progressiveImageProps} />

      {/* Error State Fallback - Avatar Specific */}
      {imageState === 'error' && finalSrc === fallbackSrc && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'text-muted-foreground',
            {
              'rounded-full': rounded,
              'rounded-lg': !rounded,
              'bg-muted': true,
            },
          )}
          style={{ backgroundColor: avatarPlaceholderColor }}
          aria-label="Avatar failed to load"
        >
          <svg
            className="h-1/2 w-1/2 opacity-60"
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

      {/* Loading indicator overlay for avatars */}
      {showSkeleton && imageState === 'loading' && (
        <div
          className={cn(
            'absolute inset-0 animate-pulse',
            'flex items-center justify-center',
            {
              'rounded-full': rounded,
              'rounded-lg': !rounded,
            },
          )}
          style={{ backgroundColor: avatarPlaceholderColor }}
          aria-hidden="true"
        >
          <div
            className={cn('animate-pulse bg-white/20', {
              'rounded-full': rounded,
              rounded: !rounded,
              'h-1/3 w-1/3': true,
            })}
          />
        </div>
      )}
    </div>
  )
}

// Export for backward compatibility with OptimizedAvatar
export { ProgressiveAvatar as OptimizedAvatar }

// Avatar group component for displaying multiple avatars
interface AvatarGroupProps {
  avatars: Array<{
    src?: string | null
    alt: string
    id: string
  }>
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  max?: number
  className?: string
  spacing?: 'tight' | 'normal' | 'loose'
  onClick?: (avatarId: string) => void
}

export function AvatarGroup({
  avatars,
  size = 'md',
  max = 5,
  className,
  spacing = 'normal',
  onClick,
}: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max)
  const remainingCount = Math.max(0, avatars.length - max)

  const spacingClasses = {
    tight: '-space-x-1',
    normal: '-space-x-2',
    loose: '-space-x-1',
  }

  const ringClasses = {
    xs: 'ring-1',
    sm: 'ring-2',
    md: 'ring-2',
    lg: 'ring-2',
    xl: 'ring-4',
    '2xl': 'ring-4',
  }

  return (
    <div
      className={cn('flex items-center', spacingClasses[spacing], className)}
    >
      {visibleAvatars.map((avatar, index) => (
        <div
          key={avatar.id}
          className={cn(
            'relative ring-white dark:ring-gray-900',
            ringClasses[size],
          )}
          style={{ zIndex: visibleAvatars.length - index }}
        >
          <ProgressiveAvatar
            src={avatar.src}
            alt={avatar.alt}
            size={size}
            onClick={() => onClick?.(avatar.id)}
            className="relative hover:z-10"
          />
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={cn(
            'relative flex items-center justify-center',
            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
            'rounded-full text-xs font-medium ring-2 ring-white dark:ring-gray-900',
            sizeClasses[size],
          )}
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
