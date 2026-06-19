'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Image } from '@unpic/react'
import { useCallback, useEffect, useState } from 'react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

interface ProjectImageCarouselProps {
  images: string[]
  alt: string
  className?: string
}

export function ProjectImageCarousel({ images, alt, className }: ProjectImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const goToNext = useCallback(() => {
    if (images.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const goToPrevious = useCallback(() => {
    if (images.length === 0) return
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  useEffect(() => {
    if (images.length === 0) {
      setCurrentIndex(0)
      return
    }

    setCurrentIndex((prev) => Math.min(prev, images.length - 1))
  }, [images.length])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrevious])

  if (!images || images.length === 0) {
    return (
      <div className={`bg-muted relative overflow-hidden rounded-xl ${className || ''}`}>
        <AspectRatio ratio={16 / 9}>
          <Image
            src="/placeholder.svg"
            alt="No images"
            layout="fullWidth"
            className="h-full w-full object-cover"
          />
        </AspectRatio>
      </div>
    )
  }

  const showNavigation = images.length > 1
  const currentImage = images[currentIndex] ?? images[0]

  return (
    <div className={cn('bg-muted relative overflow-hidden rounded-xl', className)}>
      <AspectRatio ratio={16 / 9}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentIndex}-${currentImage}`}
            className="absolute inset-0"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.995 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.22,
              ease: [0.2, 0, 0, 1],
            }}
          >
            <Image
              src={currentImage}
              alt={`${alt} - Image ${currentIndex + 1} of ${images.length}`}
              layout="fullWidth"
              className="h-full w-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </AspectRatio>

      {showNavigation && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-1/2 left-2 h-8 w-8 -translate-y-1/2 rounded-full opacity-80 transition-opacity hover:opacity-100 motion-reduce:transition-none"
            onClick={goToPrevious}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 rounded-full opacity-80 transition-opacity hover:opacity-100 motion-reduce:transition-none"
            onClick={goToNext}
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <span className="rounded-full bg-black/60 px-2 py-1 text-white text-xs">
              {currentIndex + 1} / {images.length}
            </span>
          </div>

          <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
            {images.map((imageUrl, index) => (
              <button
                key={imageUrl}
                type="button"
                onClick={() => goToIndex(index)}
                className={cn(
                  'h-2 w-2 origin-center rounded-full transition-[background-color,opacity,transform] duration-150 ease-out motion-reduce:transition-none',
                  index === currentIndex ? 'scale-x-150 bg-white' : 'bg-white/50 hover:bg-white/75',
                )}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
