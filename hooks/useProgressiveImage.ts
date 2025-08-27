"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { generateBlurPlaceholder, generateSizes, validateImageProps } from '@/lib/image-utils'

export interface UseProgressiveImageOptions {
  // Core image properties
  src: string
  fallbackSrc?: string
  
  // Progressive loading options
  enableBlurPlaceholder?: boolean
  customBlurDataURL?: string
  placeholderColor?: string
  
  // Intersection observer options
  enableLazyLoading?: boolean
  threshold?: number
  rootMargin?: string
  
  // Performance options
  preloadStrategy?: 'none' | 'hover' | 'viewport' | 'eager'
  quality?: number
  
  // Responsive options
  responsiveSizes?: {
    mobile?: string
    tablet?: string
    desktop?: string
    default?: string
  }
  
  // Callbacks
  onLoad?: () => void
  onError?: (error: Error) => void
  onLoadingStateChange?: (state: 'loading' | 'loaded' | 'error') => void
  onIntersection?: (isIntersecting: boolean) => void
}

export interface UseProgressiveImageReturn {
  // State
  loadingState: 'loading' | 'loaded' | 'error'
  isIntersecting: boolean
  shouldLoad: boolean
  blurDataURL: string | undefined
  currentSrc: string
  
  // Computed values  
  responsiveSize: string | undefined
  placeholderColorValue: string
  
  // Refs
  imageRef: React.RefObject<HTMLImageElement>
  containerRef: React.RefObject<HTMLDivElement>
  
  // Event handlers
  handleLoad: () => void
  handleError: () => void
  handleMouseEnter: () => void
  
  // Control methods
  preloadImage: () => void
  resetImage: () => void
  retryLoad: () => void
}

export function useProgressiveImage({
  src,
  fallbackSrc = '/placeholder.svg',
  enableBlurPlaceholder = true,
  customBlurDataURL,
  placeholderColor,
  enableLazyLoading = true,
  threshold = 0.1,
  rootMargin = '50px',
  preloadStrategy = 'viewport',
  quality = 75,
  responsiveSizes,
  onLoad,
  onError,
  onLoadingStateChange,
  onIntersection,
}: UseProgressiveImageOptions): UseProgressiveImageReturn {
  
  // State management
  const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(!enableLazyLoading)
  const [blurDataURL, setBlurDataURL] = useState<string | undefined>(customBlurDataURL)
  const [currentSrc, setCurrentSrc] = useState<string>(src)
  const [hasPreloaded, setHasPreloaded] = useState(false)
  
  // Refs
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null)
  const preloadedImageRef = useRef<HTMLImageElement | null>(null)
  
  // Generate responsive sizes
  const responsiveSize = useMemo(() => {
    if (!responsiveSizes) return undefined
    return generateSizes(responsiveSizes)
  }, [responsiveSizes])
  
  // Generate placeholder color
  const placeholderColorValue = useMemo(() => {
    if (placeholderColor) return placeholderColor
    
    // Generate consistent color based on src
    let hash = 0
    for (let i = 0; i < src.length; i++) {
      const char = src.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 25%, 80%)`
  }, [placeholderColor, src])
  
  // Setup intersection observer for lazy loading
  useEffect(() => {
    if (!enableLazyLoading || !containerRef.current) return
    
    const options = {
      threshold,
      rootMargin,
    }
    
    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        const isIntersectingNow = entry.isIntersecting
        
        setIsIntersecting(isIntersectingNow)
        onIntersection?.(isIntersectingNow)
        
        if (isIntersectingNow && !shouldLoad) {
          setShouldLoad(true)
        }
      },
      options
    )
    
    intersectionObserverRef.current.observe(containerRef.current)
    
    return () => {
      intersectionObserverRef.current?.disconnect()
    }
  }, [enableLazyLoading, threshold, rootMargin, onIntersection, shouldLoad])
  
  // Generate blur placeholder
  useEffect(() => {
    if (!enableBlurPlaceholder || customBlurDataURL || !shouldLoad) return
    
    let isCancelled = false
    
    generateBlurPlaceholder(currentSrc, 10)
      .then(result => {
        if (!isCancelled) {
          setBlurDataURL(result.blurDataURL)
        }
      })
      .catch(error => {
        if (!isCancelled) {
          console.warn('Failed to generate blur placeholder:', error)
          // Fallback to colored placeholder
          const canvas = `<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" fill="${placeholderColorValue}"/></svg>`
          const fallbackBlur = `data:image/svg+xml,${encodeURIComponent(canvas)}`
          setBlurDataURL(fallbackBlur)
        }
      })
    
    return () => {
      isCancelled = true
    }
  }, [enableBlurPlaceholder, customBlurDataURL, currentSrc, shouldLoad, placeholderColorValue])
  
  // Handle loading state changes
  useEffect(() => {
    onLoadingStateChange?.(loadingState)
  }, [loadingState, onLoadingStateChange])
  
  // Preload image based on strategy
  const preloadImage = useCallback(() => {
    if (hasPreloaded) return
    
    const img = new Image()
    img.src = currentSrc
    
    img.onload = () => {
      setHasPreloaded(true)
      if (preloadStrategy === 'eager') {
        setLoadingState('loaded')
      }
    }
    
    img.onerror = () => {
      // Preload failed, but don't change state yet
      console.warn('Preload failed for:', currentSrc)
    }
    
    preloadedImageRef.current = img
  }, [currentSrc, hasPreloaded, preloadStrategy])
  
  // Handle hover preloading
  const handleMouseEnter = useCallback(() => {
    if (preloadStrategy === 'hover' && !hasPreloaded) {
      preloadImage()
    }
  }, [preloadStrategy, hasPreloaded, preloadImage])
  
  // Handle image load success
  const handleLoad = useCallback(() => {
    setLoadingState('loaded')
    onLoad?.()
  }, [onLoad])
  
  // Handle image load error
  const handleError = useCallback(() => {
    const error = new Error(`Failed to load image: ${currentSrc}`)
    
    if (currentSrc !== fallbackSrc) {
      // Try fallback source
      setCurrentSrc(fallbackSrc)
      setLoadingState('loading')
    } else {
      // Fallback also failed
      setLoadingState('error')
      onError?.(error)
    }
  }, [currentSrc, fallbackSrc, onError])
  
  // Reset image to initial state
  const resetImage = useCallback(() => {
    setLoadingState('loading')
    setCurrentSrc(src)
    setHasPreloaded(false)
    setShouldLoad(!enableLazyLoading)
    
    if (preloadedImageRef.current) {
      preloadedImageRef.current.src = ''
      preloadedImageRef.current = null
    }
  }, [src, enableLazyLoading])
  
  // Retry loading current image
  const retryLoad = useCallback(() => {
    setLoadingState('loading')
    setHasPreloaded(false)
    
    if (imageRef.current) {
      imageRef.current.src = currentSrc + '?retry=' + Date.now()
    }
  }, [currentSrc])
  
  // Update current src when prop changes
  useEffect(() => {
    if (src !== currentSrc && loadingState !== 'loading') {
      setCurrentSrc(src)
      setLoadingState('loading')
      setHasPreloaded(false)
    }
  }, [src, currentSrc, loadingState])
  
  // Viewport preloading
  useEffect(() => {
    if (preloadStrategy === 'viewport' && isIntersecting && !hasPreloaded) {
      preloadImage()
    }
  }, [preloadStrategy, isIntersecting, hasPreloaded, preloadImage])
  
  // Eager preloading
  useEffect(() => {
    if (preloadStrategy === 'eager' && !hasPreloaded) {
      preloadImage()
    }
  }, [preloadStrategy, hasPreloaded, preloadImage])
  
  return {
    // State
    loadingState,
    isIntersecting,
    shouldLoad,
    blurDataURL,
    currentSrc,
    
    // Computed values
    responsiveSize,
    placeholderColorValue,
    
    // Refs
    imageRef,
    containerRef,
    
    // Event handlers
    handleLoad,
    handleError,
    handleMouseEnter,
    
    // Control methods
    preloadImage,
    resetImage,
    retryLoad,
  }
}

// Hook for managing multiple progressive images (e.g., gallery)
export interface UseProgressiveImageGalleryOptions {
  images: Array<{
    src: string
    alt: string
    id: string
  }>
  preloadCount?: number
  enableLazyLoading?: boolean
  threshold?: number
  rootMargin?: string
}

export function useProgressiveImageGallery({
  images,
  preloadCount = 3,
  enableLazyLoading = true,
  threshold = 0.1,
  rootMargin = '100px'
}: UseProgressiveImageGalleryOptions) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [errorImages, setErrorImages] = useState<Set<string>>(new Set())
  const [visibleImages, setVisibleImages] = useState<Set<string>>(new Set())
  
  const observerRef = useRef<IntersectionObserver | null>(null)
  const containerRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  
  // Setup intersection observer for gallery items
  useEffect(() => {
    if (!enableLazyLoading) return
    
    const options = {
      threshold,
      rootMargin,
    }
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const imageId = entry.target.getAttribute('data-image-id')
          if (!imageId) return
          
          if (entry.isIntersecting) {
            setVisibleImages(prev => new Set([...prev, imageId]))
          } else {
            setVisibleImages(prev => {
              const next = new Set(prev)
              next.delete(imageId)
              return next
            })
          }
        })
      },
      options
    )
    
    // Observe existing containers
    containerRefs.current.forEach(container => {
      if (container) {
        observerRef.current?.observe(container)
      }
    })
    
    return () => {
      observerRef.current?.disconnect()
    }
  }, [enableLazyLoading, threshold, rootMargin])
  
  // Preload first few images
  useEffect(() => {
    const imagesToPreload = images.slice(0, preloadCount)
    
    imagesToPreload.forEach(({ src, id }) => {
      const img = new Image()
      img.src = src
      
      img.onload = () => {
        setLoadedImages(prev => new Set([...prev, id]))
      }
      
      img.onerror = () => {
        setErrorImages(prev => new Set([...prev, id]))
      }
    })
  }, [images, preloadCount])
  
  // Register container ref
  const registerContainer = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) {
      element.setAttribute('data-image-id', id)
      containerRefs.current.set(id, element)
      observerRef.current?.observe(element)
    } else {
      const existing = containerRefs.current.get(id)
      if (existing) {
        observerRef.current?.unobserve(existing)
        containerRefs.current.delete(id)
      }
    }
  }, [])
  
  // Get image state
  const getImageState = useCallback((id: string) => {
    if (errorImages.has(id)) return 'error'
    if (loadedImages.has(id)) return 'loaded' 
    return 'loading'
  }, [loadedImages, errorImages])
  
  return {
    loadedImages,
    errorImages,
    visibleImages,
    registerContainer,
    getImageState,
  }
}
