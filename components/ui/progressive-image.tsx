'use client'

import type { ImageProps, StaticImageData } from 'next/image'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { generateSizes, validateImageProps } from '@/lib/image-utils'
import { cn } from '@/lib/utils'

export type ImageLoadingState = 'loading' | 'loaded' | 'error'

export interface ProgressiveImageProps extends Omit<ImageProps, 'placeholder' | 'blurDataURL'> {
  src: string | StaticImageData
  fallbackSrc?: string
  onLoadingStateChange?: (state: ImageLoadingState) => void
  responsiveSizes?: {
    mobile?: string
    tablet?: string
    desktop?: string
    default?: string
  }
  preloadStrategy?: 'none' | 'hover' | 'viewport'
  loadingThreshold?: number
  ariaLabel?: string
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
  fallbackSrc = '/placeholder.svg',
  onLoadingStateChange,
  responsiveSizes,
  ariaLabel,
  ...restProps
}: ProgressiveImageProps) {
  const [loadingState, setLoadingState] = useState<ImageLoadingState>('loading')
  const [currentSrc, setCurrentSrc] = useState<string>(typeof src === 'string' ? src : src.src)

  const responsiveSize = useMemo(() => {
    if (propSizes) return propSizes
    if (responsiveSizes) return generateSizes(responsiveSizes)
    return fill ? '100vw' : undefined
  }, [propSizes, responsiveSizes, fill])

  useEffect(() => {
    onLoadingStateChange?.(loadingState)
  }, [loadingState, onLoadingStateChange])

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setLoadingState('loaded')
    onLoad?.(event)
  }

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setLoadingState('error')
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      setLoadingState('loading')
    }
    onError?.(event)
  }

  const imageClasses = cn(
    'transition-opacity ease-in-out',
    {
      'opacity-0': loadingState === 'loading',
      'opacity-100': loadingState === 'loaded',
      'opacity-80': loadingState === 'error',
    },
    className,
  )

  return (
    <div className={cn('relative overflow-hidden', fill ? 'relative' : 'w-full h-full')}>
      {loadingState === 'loading' && (
        <div
          className="absolute inset-0 animate-pulse transition-opacity duration-300 flex items-center justify-center"
          aria-hidden="true"
        >
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

      <Image
        src={currentSrc}
        alt={ariaLabel || (typeof alt === 'string' ? alt : '')}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={responsiveSize}
        loading={priority ? undefined : loading || 'lazy'}
        decoding={decoding}
        unoptimized={unoptimized}
        className={imageClasses}
        style={{
          ...style,
          ...(width && height && !fill ? { aspectRatio: `${width} / ${height}` } : {}),
        }}
        onLoad={handleLoad}
        onError={handleError}
        {...restProps}
      />

      {loadingState === 'error' && currentSrc === fallbackSrc && (
        <div
          className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-sm text-gray-400 dark:text-gray-500"
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
          <span className="px-2 text-center">{alt ? 'Image unavailable' : 'Failed to load'}</span>
        </div>
      )}
    </div>
  )
}

export default ProgressiveImage
