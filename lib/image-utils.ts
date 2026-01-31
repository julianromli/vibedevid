/**
 * Image utilities for progressive loading with Next.js 15
 * Provides functions for blur placeholder generation, optimal sizing, and responsive image handling
 */

import type { ImageProps } from 'next/image'
import { getImageProps } from 'next/image'

// Type definitions
export interface BlurPlaceholderResult {
  blurDataURL: string
  width: number
  height: number
}

export interface OptimalImageProps {
  mobile: ReturnType<typeof getImageProps>['props']
  tablet: ReturnType<typeof getImageProps>['props']
  desktop: ReturnType<typeof getImageProps>['props']
}

export interface ImageVariant {
  src: string
  width: number
  height: number
  quality: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
}

/**
 * Generate blur placeholder data URL from image source
 * Simple fallback implementation for client-side compatibility
 */
export async function generateBlurPlaceholder(src: string, size: number = 10): Promise<BlurPlaceholderResult> {
  // Generate simple colored placeholder based on src
  const color = generatePlaceholderColor(src)
  const canvas = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" fill="${color}"/></svg>`
  const base64 = `data:image/svg+xml,${encodeURIComponent(canvas)}`

  return {
    blurDataURL: base64,
    width: size,
    height: size,
  }
}

/**
 * Generate optimal image props for different breakpoints
 * Uses Next.js getImageProps for art direction support
 */
export function getOptimalImageProps(
  src: string,
  alt: string,
  options: {
    mobileWidth?: number
    mobileHeight?: number
    tabletWidth?: number
    tabletHeight?: number
    desktopWidth?: number
    desktopHeight?: number
    quality?: number
  } = {},
): OptimalImageProps {
  const {
    mobileWidth = 750,
    mobileHeight = 1334,
    tabletWidth = 1080,
    tabletHeight = 1920,
    desktopWidth = 1920,
    desktopHeight = 1080,
    quality = 75,
  } = options

  const common = {
    alt,
    src,
    quality,
    sizes: '100vw',
  }

  const mobile = getImageProps({
    ...common,
    width: mobileWidth,
    height: mobileHeight,
    quality: Math.max(60, quality - 15), // Lower quality for mobile
  })

  const tablet = getImageProps({
    ...common,
    width: tabletWidth,
    height: tabletHeight,
    quality: Math.max(70, quality - 10), // Medium quality for tablet
  })

  const desktop = getImageProps({
    ...common,
    width: desktopWidth,
    height: desktopHeight,
    quality,
  })

  return { mobile: mobile.props, tablet: tablet.props, desktop: desktop.props }
}

/**
 * Generate responsive sizes string based on breakpoints
 * Provides optimal sizes for different viewport widths
 */
export function generateSizes(
  options: { mobile?: string; tablet?: string; desktop?: string; default?: string } = {},
): string {
  const { mobile = '100vw', tablet = '50vw', desktop = '33vw', default: defaultSize = '100vw' } = options

  return `(max-width: 640px) ${mobile}, (max-width: 1024px) ${tablet}, (max-width: 1536px) ${desktop}, ${defaultSize}`
}

/**
 * Calculate optimal image dimensions based on container and viewport
 */
export function calculateOptimalSize(
  containerWidth: number,
  containerHeight: number,
  viewportWidth: number = 1920,
  aspectRatio?: number,
): { width: number; height: number } {
  // Handle responsive scaling
  const scaleFactor = Math.min(viewportWidth / 1920, 1)
  const scaledWidth = Math.round(containerWidth * scaleFactor)

  if (aspectRatio) {
    return {
      width: scaledWidth,
      height: Math.round(scaledWidth / aspectRatio),
    }
  }

  const scaledHeight = Math.round(containerHeight * scaleFactor)
  return {
    width: scaledWidth,
    height: scaledHeight,
  }
}

/**
 * Create multiple image variants for different use cases
 */
export function createImageVariants(baseSrc: string, baseWidth: number, baseHeight: number): ImageVariant[] {
  const variants: ImageVariant[] = []

  // Different quality levels
  const qualities = [60, 75, 85, 95]

  // Different sizes (percentage of original)
  const sizeMultipliers = [0.25, 0.5, 0.75, 1]

  qualities.forEach((quality) => {
    sizeMultipliers.forEach((multiplier) => {
      variants.push({
        src: baseSrc,
        width: Math.round(baseWidth * multiplier),
        height: Math.round(baseHeight * multiplier),
        quality,
        format: 'webp', // Default to WebP for modern browsers
      })
    })
  })

  return variants
}

/**
 * Check if an image source is external (remote)
 */
export function isExternalImage(src: string): boolean {
  return src.startsWith('http://') || src.startsWith('https://')
}

/**
 * Get image format from file extension or URL
 */
export function getImageFormat(src: string): 'jpeg' | 'jpg' | 'png' | 'webp' | 'avif' | 'svg' | 'gif' | 'unknown' {
  const extension = src.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'jpeg'
    case 'png':
      return 'png'
    case 'webp':
      return 'webp'
    case 'avif':
      return 'avif'
    case 'svg':
      return 'svg'
    case 'gif':
      return 'gif'
    default:
      return 'unknown'
  }
}

/**
 * Convert srcSet string to CSS image-set() for background images
 * Useful for background image optimization with Next.js getImageProps
 */
export function getBackgroundImageSet(srcSet: string): string {
  if (!srcSet) return ''

  const imageSet = srcSet
    .split(', ')
    .map((str) => {
      const [url, dpi] = str.split(' ')
      return `url("${url}") ${dpi}`
    })
    .join(', ')

  return `image-set(${imageSet})`
}

/**
 * Generate placeholder color based on image characteristics
 * Simple implementation that could be enhanced with dominant color extraction
 */
export function generatePlaceholderColor(src: string): string {
  // Simple hash-based color generation for consistent placeholder colors
  let hash = 0
  for (let i = 0; i < src.length; i++) {
    const char = src.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  // Generate a muted color
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 20%, 85%)`
}

/**
 * Validate image props for common issues
 */
export function validateImageProps(props: Partial<ImageProps>): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Required props validation
  if (!props.src) {
    errors.push('src prop is required')
  }

  if (!props.alt && props.alt !== '') {
    errors.push('alt prop is required for accessibility')
  }

  // Size validation
  if (!props.fill && (!props.width || !props.height)) {
    errors.push('width and height are required when not using fill prop')
  }

  // Performance warnings
  if (props.priority && props.loading === 'lazy') {
    warnings.push('priority=true conflicts with loading="lazy"')
  }

  if (props.placeholder === 'blur' && !props.blurDataURL) {
    warnings.push('blurDataURL is recommended when using placeholder="blur"')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
