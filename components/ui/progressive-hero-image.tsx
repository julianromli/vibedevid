"use client"

import { useMemo } from 'react'
import { getImageProps } from 'next/image'
import { cn } from '@/lib/utils'
import { ProgressiveImage } from './progressive-image'
import { getOptimalImageProps, getBackgroundImageSet } from '@/lib/image-utils'
import type { ProgressiveImageProps } from './progressive-image'

interface ProgressiveHeroImageProps {
  // Source images for different devices
  src: string
  mobileSrc?: string
  tabletSrc?: string
  desktopSrc?: string
  
  // Basic props
  alt: string
  priority?: boolean
  
  // Container styling
  className?: string
  imageClassName?: string
  
  // Art direction dimensions
  mobileWidth?: number
  mobileHeight?: number
  tabletWidth?: number
  tabletHeight?: number
  desktopWidth?: number
  desktopHeight?: number
  
  // Progressive loading
  enableBlurPlaceholder?: boolean
  customBlurDataURL?: string
  placeholderColor?: string
  quality?: number
  
  // Layout options
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  objectPosition?: string
  
  // Overlay options
  overlay?: boolean
  overlayColor?: string
  overlayOpacity?: number
  
  // Content props
  children?: React.ReactNode
  
  // Callbacks
  onLoad?: () => void
  onError?: () => void
}

export function ProgressiveHeroImage({
  src,
  mobileSrc,
  tabletSrc,
  desktopSrc,
  alt,
  priority = true, // Hero images are typically above the fold
  
  className,
  imageClassName,
  
  // Art direction dimensions
  mobileWidth = 750,
  mobileHeight = 1334,
  tabletWidth = 1080,
  tabletHeight = 1920,
  desktopWidth = 1920,
  desktopHeight = 1080,
  
  // Progressive loading
  enableBlurPlaceholder = true,
  customBlurDataURL,
  placeholderColor,
  quality = 85,
  
  // Layout
  objectFit = 'cover',
  objectPosition = 'center',
  
  // Overlay
  overlay = false,
  overlayColor = 'rgba(0, 0, 0, 0.4)',
  overlayOpacity = 40,
  
  // Content
  children,
  
  // Callbacks
  onLoad,
  onError,
}: ProgressiveHeroImageProps) {
  
  // Generate art direction sources
  const artDirectionSources = useMemo(() => {
    const sources = []
    
    // Desktop source
    if (desktopSrc || src) {
      const { props: desktopProps } = getImageProps({
        src: desktopSrc || src,
        alt,
        width: desktopWidth,
        height: desktopHeight,
        quality,
        sizes: '100vw',
      })
      
      sources.push({
        media: '(min-width: 1024px)',
        srcSet: desktopProps.srcSet,
        type: 'image/webp'
      })
    }
    
    // Tablet source
    if (tabletSrc || src) {
      const { props: tabletProps } = getImageProps({
        src: tabletSrc || src,
        alt,
        width: tabletWidth,
        height: tabletHeight,
        quality: Math.max(quality - 10, 60),
        sizes: '100vw',
      })
      
      sources.push({
        media: '(min-width: 768px)',
        srcSet: tabletProps.srcSet,
        type: 'image/webp'
      })
    }
    
    // Mobile source  
    if (mobileSrc || src) {
      const { props: mobileProps } = getImageProps({
        src: mobileSrc || src,
        alt,
        width: mobileWidth,
        height: mobileHeight,
        quality: Math.max(quality - 20, 50),
        sizes: '100vw',
      })
      
      sources.push({
        media: '(max-width: 767px)',
        srcSet: mobileProps.srcSet,
        type: 'image/webp'
      })
    }
    
    return sources
  }, [src, mobileSrc, tabletSrc, desktopSrc, alt, mobileWidth, mobileHeight, tabletWidth, tabletHeight, desktopWidth, desktopHeight, quality])
  
  // Generate responsive sizes
  const responsiveSizes = useMemo(() => ({
    mobile: '100vw',
    tablet: '100vw', 
    desktop: '100vw',
    default: '100vw'
  }), [])
  
  const containerClasses = cn(
    'relative w-full overflow-hidden',
    className
  )
  
  const imageClasses = cn(
    'w-full h-full',
    imageClassName
  )
  
  const overlayClasses = cn(
    'absolute inset-0 z-10',
    overlay && 'pointer-events-none'
  )
  
  // Use art direction if multiple sources provided
  if (artDirectionSources.length > 1) {
    return (
      <div className={containerClasses}>
        <picture className="w-full h-full">
          {artDirectionSources.map((source, index) => (
            <source
              key={index}
              media={source.media}
              srcSet={source.srcSet}
              type={source.type}
            />
          ))}
          <ProgressiveImage
            src={src}
            alt={alt}
            fill
            priority={priority}
            quality={quality}
            sizes="100vw"
            enableBlurPlaceholder={enableBlurPlaceholder}
            customBlurDataURL={customBlurDataURL}
            placeholderColor={placeholderColor}
            responsiveSizes={responsiveSizes}
            className={imageClasses}
            style={{
              objectFit,
              objectPosition,
            }}
            onLoad={onLoad}
            onError={onError}
          />
        </picture>
        
        {/* Overlay */}
        {overlay && (
          <div 
            className={overlayClasses}
            style={{ 
              backgroundColor: overlayColor,
              opacity: overlayOpacity / 100 
            }}
          />
        )}
        
        {/* Content */}
        {children && (
          <div className="absolute inset-0 z-20 flex flex-col justify-center">
            {children}
          </div>
        )}
      </div>
    )
  }
  
  // Single source implementation
  return (
    <div className={containerClasses}>
      <ProgressiveImage
        src={src}
        alt={alt}
        fill
        priority={priority}
        quality={quality}
        sizes="100vw"
        enableBlurPlaceholder={enableBlurPlaceholder}
        customBlurDataURL={customBlurDataURL}
        placeholderColor={placeholderColor}
        responsiveSizes={responsiveSizes}
        className={imageClasses}
        style={{
          objectFit,
          objectPosition,
        }}
        onLoad={onLoad}
        onError={onError}
      />
      
      {/* Overlay */}
      {overlay && (
        <div 
          className={overlayClasses}
          style={{ 
            backgroundColor: overlayColor,
            opacity: overlayOpacity / 100 
          }}
        />
      )}
      
      {/* Content */}
      {children && (
        <div className="absolute inset-0 z-20 flex flex-col justify-center">
          {children}
        </div>
      )}
    </div>
  )
}

// Background Image Component using CSS image-set
interface ProgressiveBackgroundImageProps {
  src: string
  alt?: string
  className?: string
  
  // Background specific
  backgroundSize?: 'cover' | 'contain' | 'auto'
  backgroundPosition?: string
  backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'
  
  // Progressive loading
  enableBlurPlaceholder?: boolean
  customBlurDataURL?: string
  placeholderColor?: string
  quality?: number
  
  // Art direction
  mobileWidth?: number
  mobileHeight?: number
  desktopWidth?: number
  desktopHeight?: number
  
  // Overlay
  overlay?: boolean
  overlayColor?: string
  overlayOpacity?: number
  
  children?: React.ReactNode
}

export function ProgressiveBackgroundImage({
  src,
  alt = '',
  className,
  
  // Background props
  backgroundSize = 'cover',
  backgroundPosition = 'center',
  backgroundRepeat = 'no-repeat',
  
  // Progressive loading
  enableBlurPlaceholder = true,
  customBlurDataURL,
  placeholderColor = '#f3f4f6',
  quality = 75,
  
  // Art direction
  mobileWidth = 750,
  mobileHeight = 1334,
  desktopWidth = 1920,
  desktopHeight = 1080,
  
  // Overlay
  overlay = false,
  overlayColor = 'rgba(0, 0, 0, 0.3)',
  overlayOpacity = 30,
  
  children,
}: ProgressiveBackgroundImageProps) {
  
  // Generate background image-set
  const backgroundImageSet = useMemo(() => {
    const { props: mobileProps } = getImageProps({
      src,
      alt,
      width: mobileWidth,
      height: mobileHeight,
      quality: Math.max(quality - 15, 50),
      sizes: '100vw',
    })
    
    const { props: desktopProps } = getImageProps({
      src,
      alt,
      width: desktopWidth,
      height: desktopHeight,
      quality,
      sizes: '100vw',
    })
    
    return {
      mobile: getBackgroundImageSet(mobileProps.srcSet || ''),
      desktop: getBackgroundImageSet(desktopProps.srcSet || ''),
    }
  }, [src, alt, mobileWidth, mobileHeight, desktopWidth, desktopHeight, quality])
  
  const containerClasses = cn(
    'relative w-full h-full',
    className
  )
  
  return (
    <div 
      className={containerClasses}
      style={{
        backgroundImage: backgroundImageSet.desktop || `url(${src})`,
        backgroundSize,
        backgroundPosition,
        backgroundRepeat,
      }}
    >
      {/* Mobile background via CSS media query */}
      <style jsx>{`
        @media (max-width: 767px) {
          .mobile-bg {
            background-image: ${backgroundImageSet.mobile || `url(${src})`};
          }
        }
      `}</style>
      
      {/* Loading placeholder */}
      {enableBlurPlaceholder && (
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            backgroundColor: placeholderColor,
            backgroundImage: customBlurDataURL ? `url(${customBlurDataURL})` : undefined,
          }}
        />
      )}
      
      {/* Overlay */}
      {overlay && (
        <div 
          className="absolute inset-0 z-10"
          style={{ 
            backgroundColor: overlayColor,
            opacity: overlayOpacity / 100 
          }}
        />
      )}
      
      {/* Content */}
      {children && (
        <div className="relative z-20 w-full h-full">
          {children}
        </div>
      )}
    </div>
  )
}

// Export both components
export default ProgressiveHeroImage
