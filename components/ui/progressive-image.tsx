'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  generateSizes,
  validateImageProps,
  generatePlaceholderColor,
} from '@/lib/image-utils'
import type { ImageProps } from 'next/image'
import type { StaticImageData } from 'next/image'

// Extended props interface for ProgressiveImage
export interface ProgressiveImageProps
  extends Omit<ImageProps, 'placeholder' | 'blurDataURL'> {
  src: string | StaticImageData
  // Progressive loading options
  enableBlurPlaceholder?: boolean
  customBlurDataURL?: string
  placeholderColor?: string

  // Loading states
  showSkeleton?: boolean
  fadeTransition?: boolean
  transitionDuration?: number

  // Error handling
  fallbackSrc?: string
  onLoadingStateChange?: (state: 'loading' | 'loaded' | 'error') => void

  // Responsive options
  responsiveSizes?: {
    mobile?: string
    tablet?: string
    desktop?: string
    default?: string
  }

  // Performance
  preloadStrategy?: 'none' | 'hover' | 'viewport'
  loadingThreshold?: number // Intersection observer threshold

  // Accessibility
  ariaLabel?: string
  decorative?: boolean // If true, sets alt="" and aria-hidden="true"
}

export function ProgressiveImage({
  src,
  alt,
  width,
  height,
  fill,
  priority = false,
  quality = 75,
  sizes: propSizes,
  className,
  style,
  loading,
  decoding = 'async',
  onLoad,
  onError,
  unoptimized = false,

  // Progressive loading props
  enableBlurPlaceholder = true,
  customBlurDataURL,
  placeholderColor,
  showSkeleton = true,
  fadeTransition = true,
  transitionDuration = 300,

  // Error handling
  fallbackSrc = '/placeholder.svg',
  onLoadingStateChange,

  // Responsive
  responsiveSizes,

  // Performance
  preloadStrategy = 'none',
  loadingThreshold = 0.1,

  // Accessibility
  ariaLabel,
  decorative = false,

  ...restProps
}: ProgressiveImageProps) {
  // State management
  const [loadingState, setLoadingState] = useState<
    'loading' | 'loaded' | 'error'
  >('loading')
  const [currentSrc, setCurrentSrc] = useState<string>(
    typeof src === 'string' ? src : src.src,
  )
  const [blurDataURL, setBlurDataURL] = useState<string | undefined>(
    customBlurDataURL,
  )

  // Generate responsive sizes
  const responsiveSize = useMemo(() => {
    if (propSizes) return propSizes
    if (responsiveSizes) return generateSizes(responsiveSizes)
    return fill ? '100vw' : undefined
  }, [propSizes, responsiveSizes, fill])

  // Generate placeholder color if needed
  const autoPlaceholderColor = useMemo(() => {
    const srcString =
      typeof src === 'string' ? src : src.src || '/placeholder.svg'
    return placeholderColor || generatePlaceholderColor(srcString)
  }, [placeholderColor, src])

  // Validate props (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const validation = validateImageProps({
        src: currentSrc,
        alt: decorative ? '' : alt,
        width,
        height,
        fill,
        priority,
        loading: loading as any,
        placeholder: enableBlurPlaceholder ? 'blur' : 'empty',
        blurDataURL,
      })

      if (!validation.isValid) {
        console.error('ProgressiveImage validation errors:', validation.errors)
      }

      if (validation.warnings.length > 0) {
        console.warn('ProgressiveImage warnings:', validation.warnings)
      }
    }
  }, [
    currentSrc,
    alt,
    width,
    height,
    fill,
    priority,
    loading,
    enableBlurPlaceholder,
    blurDataURL,
    decorative,
  ])

  // Generate simple blur placeholder
  useEffect(() => {
    if (enableBlurPlaceholder && !customBlurDataURL) {
      // Simple colored placeholder using URL encoding instead of base64
      const canvas = `<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" fill="${autoPlaceholderColor}"/></svg>`
      const fallbackBlur = `data:image/svg+xml,${encodeURIComponent(canvas)}`
      setBlurDataURL(fallbackBlur)
    }
  }, [src, enableBlurPlaceholder, customBlurDataURL, autoPlaceholderColor])

  // Handle loading state changes
  useEffect(() => {
    onLoadingStateChange?.(loadingState)
  }, [loadingState, onLoadingStateChange])

  // Image load handlers
  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setLoadingState('loaded')
    onLoad?.(event)
  }

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setLoadingState('error')

    // Try fallback if current src is not already the fallback
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      setLoadingState('loading') // Reset to loading for fallback
    }

    onError?.(event)
  }

  // Determine placeholder strategy
  const placeholderStrategy: 'blur' | 'empty' = useMemo(() => {
    if (!enableBlurPlaceholder || unoptimized) return 'empty'
    return blurDataURL ? 'blur' : 'empty'
  }, [enableBlurPlaceholder, unoptimized, blurDataURL])

  // Compute class names with transitions
  const imageClasses = cn(
    // Base classes
    'transition-opacity ease-in-out',

    // Transition duration
    fadeTransition && `duration-${transitionDuration}`,

    // Loading state classes
    {
      'opacity-0': loadingState === 'loading' && showSkeleton,
      'opacity-100':
        loadingState === 'loaded' ||
        (loadingState === 'loading' && !showSkeleton),
      'opacity-80': loadingState === 'error', // Slightly faded for error state
    },

    className,
  )

  // Container classes for layout and skeleton
  const containerClasses = cn('relative overflow-hidden', {
    'w-full h-full': fill,
    [`w-[${width}px] h-[${height}px]`]: width && height && !fill,
  })

  return (
    <div className={fill ? 'relative' : containerClasses}>
      {/* Skeleton/Loading placeholder */}
      {showSkeleton && loadingState === 'loading' && (
        <div
          className={cn(
            'absolute inset-0 animate-pulse transition-opacity duration-300',
            'flex items-center justify-center',
            fill ? 'h-full w-full' : `w-[${width}px] h-[${height}px]`,
          )}
          style={{ backgroundColor: autoPlaceholderColor }}
          aria-hidden="true"
        >
          {/* Optional loading icon */}
          <div className="h-8 w-8 opacity-20">
            <svg
              className="animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Main Image */}
      <Image
        src={currentSrc}
        alt={decorative ? '' : ariaLabel || alt}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={responsiveSize}
        loading={priority ? undefined : loading || 'lazy'}
        decoding={decoding}
        placeholder={placeholderStrategy}
        blurDataURL={blurDataURL}
        unoptimized={unoptimized}
        className={imageClasses}
        style={{
          ...style,
          // Prevent layout shift
          ...(width && height && !fill
            ? { aspectRatio: `${width} / ${height}` }
            : {}),
        }}
        onLoad={handleLoad}
        onError={handleError}
        aria-hidden={decorative}
        {...restProps}
      />

      {/* Error State Overlay */}
      {loadingState === 'error' && currentSrc === fallbackSrc && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-100 dark:bg-gray-800',
            'flex flex-col items-center justify-center',
            'text-sm text-gray-400 dark:text-gray-500',
          )}
          aria-label="Image failed to load"
        >
          <svg
            className="mb-2 h-8 w-8"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
          <span className="px-2 text-center">
            {alt ? 'Image unavailable' : 'Failed to load'}
          </span>
        </div>
      )}
    </div>
  )
}

// Named export for specific use cases
export { ProgressiveImage as default }
