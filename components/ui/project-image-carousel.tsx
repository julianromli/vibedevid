'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'

interface ProjectImageCarouselProps {
  images: string[]
  alt: string
  className?: string
}

export function ProjectImageCarousel({ images, alt, className }: ProjectImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

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
            fill
            className="h-full w-full object-cover"
          />
        </AspectRatio>
      </div>
    )
  }

  const showNavigation = images.length > 1

  return (
    <div className={`bg-muted relative overflow-hidden rounded-xl ${className || ''}`}>
      <AspectRatio ratio={16 / 9}>
        <Image
          src={images[currentIndex]}
          alt={`${alt} - Image ${currentIndex + 1} of ${images.length}`}
          fill
          priority
          className="h-full w-full object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
        />
      </AspectRatio>

      {showNavigation && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100 transition-opacity"
            onClick={goToPrevious}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100 transition-opacity"
            onClick={goToNext}
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </span>
          </div>

          <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
            {images.map((imageUrl, index) => (
              <button
                key={imageUrl}
                type="button"
                onClick={() => goToIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
