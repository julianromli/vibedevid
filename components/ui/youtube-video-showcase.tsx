'use client'

import { Calendar, Code, Play, Users, Video } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import type { VibeVideo, VideoIconKey } from '@/types/homepage'

const applyThumbnailFallback = (target: HTMLImageElement) => {
  if (target.src.includes('vibedev-guest-avatar.png')) {
    target.src =
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMzRjNWQiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNmNDY4MmYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+VmlkZW8gVGh1bWJuYWlsPC90ZXh0Pjwvc3ZnPg=='
    return
  }

  target.src = '/vibedev-guest-avatar.png'
}

function getVideoIcon(iconKey: VideoIconKey) {
  const iconProps = { size: 24, className: 'text-white' }

  switch (iconKey) {
    case 'play':
      return <Play {...iconProps} />
    case 'users':
      return <Users {...iconProps} />
    case 'video':
      return <Video {...iconProps} />
    default:
      return <Code {...iconProps} />
  }
}

interface DesktopVideoOptionProps {
  video: VibeVideo
  index: number
  activeIndex: number
  animatedVideos: number[]
  onVideoClick: (index: number) => void
  onPlayVideo: (videoId: string) => void
  formatDate: (dateString: string) => string
  watchLabel: string
  videoLabel: string
  viewsLabel: string
}

interface DesktopVideoInfoOverlayProps {
  video: VibeVideo
  isActive: boolean
  formatDate: (dateString: string) => string
  watchLabel: string
  videoLabel: string
  viewsLabel: string
  onPlayVideo: (videoId: string) => void
}

function DesktopVideoInfoOverlay({
  video,
  isActive,
  formatDate,
  watchLabel,
  videoLabel,
  viewsLabel,
  onPlayVideo,
}: DesktopVideoInfoOverlayProps) {
  return (
    <div className="video-label pointer-events-none absolute right-0 bottom-0 left-0 z-20 flex h-full w-full flex-col justify-end p-4">
      <div className="mt-auto">
        <div className="mb-3 flex items-center gap-3">
          <div className="video-icon flex h-[40px] max-w-[40px] min-w-[40px] flex-shrink-0 items-center justify-center rounded-full border border-white/30 bg-black/90 shadow-lg backdrop-blur-sm">
            {getVideoIcon(video.iconKey)}
          </div>

          <div className="video-info relative flex-1 text-white">
            <div
              className="video-title line-clamp-2 text-sm font-bold transition-all duration-700 ease-in-out md:text-base"
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? 'translateX(0)' : 'translateX(25px)',
                textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 1px 4px rgba(0,0,0,0.9)',
              }}
            >
              {video.title}
            </div>
            <div
              className="video-desc line-clamp-2 text-xs text-gray-200 transition-all duration-700 ease-in-out md:text-sm"
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? 'translateX(0)' : 'translateX(25px)',
                textShadow: '0 1px 6px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,1)',
              }}
            >
              {video.description}
            </div>
            <div
              className="video-meta mt-1 flex items-center gap-2 text-xs text-gray-300 transition-all duration-700 ease-in-out"
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? 'translateX(0)' : 'translateX(25px)',
                textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,1)',
              }}
            >
              <span>{formatDate(video.publishedAt)}</span>
              {video.viewCount && (
                <>
                  <span>•</span>
                  <span>
                    {video.viewCount} {viewsLabel}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {isActive && (
          <div
            className="transition-all duration-700 ease-in-out"
            style={{
              opacity: isActive ? 1 : 0,
              transform: isActive ? 'translateY(0)' : 'translateY(15px)',
            }}
          >
            <button
              type="button"
              onClick={() => onPlayVideo(video.videoId)}
              className="pointer-events-auto relative z-30 flex min-h-[36px] touch-manipulation items-center gap-1 rounded-full bg-red-600 px-3 py-2 text-xs font-medium text-white transition-colors duration-200 hover:bg-red-700 sm:min-h-[40px] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
            >
              <Play className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="xs:inline hidden sm:inline">{watchLabel}</span> {videoLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function DesktopVideoOption({
  video,
  index,
  activeIndex,
  animatedVideos,
  onVideoClick,
  onPlayVideo,
  formatDate,
  watchLabel,
  videoLabel,
  viewsLabel,
}: DesktopVideoOptionProps) {
  const isActive = activeIndex === index

  return (
    <article
      className={`video-option relative min-w-[60px] cursor-pointer overflow-hidden rounded-xl bg-[hsl(var(--muted))] transition-all duration-700 ease-in-out will-change-[flex-grow,box-shadow,transform] ${
        isActive ? 'active border-primary border-2 shadow-2xl' : 'border-border border-2 shadow-lg'
      } `}
      style={{
        opacity: animatedVideos.includes(index) ? 1 : 0,
        transform: animatedVideos.includes(index) ? 'translateX(0)' : 'translateX(-60px)',
        boxShadow: isActive ? '0 20px 60px rgba(0,0,0,0.25)' : '0 10px 30px rgba(0,0,0,0.15)',
        flex: isActive ? '7 1 0%' : '1 1 0%',
        zIndex: isActive ? 10 : 1,
      }}
    >
      <button
        type="button"
        aria-label={video.title}
        className="absolute inset-0 z-10"
        onClick={() => onVideoClick(index)}
      />

      <div className="absolute inset-0 h-full w-full">
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          className={`rounded-xl object-cover transition-all duration-700 ease-in-out ${isActive ? 'scale-100' : 'scale-105'}`}
          sizes="(max-width: 1200px) 50vw, 33vw"
          priority={index === 0}
          quality={85}
          onError={(e) => {
            applyThumbnailFallback(e.currentTarget as HTMLImageElement)
          }}
        />
      </div>

      <div
        className="video-shadow pointer-events-none absolute right-0 left-0 transition-all duration-700 ease-in-out"
        style={{
          bottom: isActive ? '0' : '-60px',
          height: '160px',
          background: isActive
            ? 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.75), rgba(0,0,0,0.3), transparent)'
            : 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2), transparent)',
        }}
      />

      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/80 shadow-lg backdrop-blur-sm sm:h-14 sm:w-14">
            <Play className="ml-1 h-6 w-6 text-white sm:h-7 sm:w-7" />
          </div>
        </div>
      )}

      <DesktopVideoInfoOverlay
        video={video}
        isActive={isActive}
        formatDate={formatDate}
        watchLabel={watchLabel}
        videoLabel={videoLabel}
        viewsLabel={viewsLabel}
        onPlayVideo={onPlayVideo}
      />
    </article>
  )
}

interface YouTubeVideoShowcaseProps {
  vibeVideos: VibeVideo[]
}

export function YouTubeVideoShowcase({ vibeVideos }: YouTubeVideoShowcaseProps) {
  const t = useTranslations('youtubeShowcase')
  const [activeIndex, setActiveIndex] = useState(0)
  const [animatedVideos, setAnimatedVideos] = useState<number[]>([])

  const handleVideoClick = (index: number) => {
    if (index !== activeIndex) {
      setActiveIndex(index)
    }
  }

  const handlePlayVideo = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer')
  }

  useEffect(() => {
    if (vibeVideos.length === 0) return

    const timers: NodeJS.Timeout[] = []

    vibeVideos.forEach((_, i) => {
      const timer = setTimeout(() => {
        setAnimatedVideos((prev) => [...prev, i])
      }, 180 * i)
      timers.push(timer)
    })

    return () => {
      timers.forEach((timer) => {
        clearTimeout(timer)
      })
    }
  }, [vibeVideos])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="text-foreground w-full font-sans">
      {/* Header Section */}
      <div className="mx-auto mb-12 w-full max-w-5xl px-4 text-center sm:px-6">
        <h2 className="text-foreground mb-4 text-4xl font-bold tracking-tight lg:text-5xl">{t('title')}</h2>
        <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-xl">{t('description')}</p>
      </div>

      {/* Mobile: vertical list */}
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-2 md:hidden">
        {vibeVideos.map((video, index) => (
          <article
            key={video.id ?? video.videoId}
            className="bg-card relative overflow-hidden rounded-xl border border-border/60 shadow-sm"
          >
            <AspectRatio ratio={16 / 9}>
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                className="object-cover"
                sizes="100vw"
                priority={index === 0}
                quality={80}
                onError={(e) => {
                  applyThumbnailFallback(e.currentTarget as HTMLImageElement)
                }}
              />
            </AspectRatio>

            <div className="p-4">
              <h3 className="line-clamp-2 text-base font-semibold">{video.title}</h3>
              <p className="text-muted-foreground line-clamp-2 mt-1 text-sm">{video.description}</p>
              <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(video.publishedAt)}</span>
                {video.viewCount && (
                  <>
                    <span>•</span>
                    <span>
                      {video.viewCount} {t('views')}
                    </span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => handlePlayVideo(video.videoId)}
                className="mt-3 inline-flex min-h-[40px] touch-manipulation items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-red-700"
              >
                <Play className="h-4 w-4" />
                {t('watch')} {t('videoLabel')}
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Desktop/Tablet: horizontal interactive showcase */}
      <div
        className="videos-container relative mx-auto hidden w-full max-w-6xl min-w-[300px] gap-1 overflow-hidden rounded-xl px-0 md:flex"
        style={{ height: 'auto', aspectRatio: '5/2' }}
      >
        {vibeVideos.map((video, index) => (
          <DesktopVideoOption
            key={video.id ?? video.videoId}
            video={video}
            index={index}
            activeIndex={activeIndex}
            animatedVideos={animatedVideos}
            onVideoClick={handleVideoClick}
            onPlayVideo={handlePlayVideo}
            formatDate={formatDate}
            watchLabel={t('watch')}
            videoLabel={t('videoLabel')}
            viewsLabel={t('views')}
          />
        ))}
      </div>

      {/* View All Videos Link */}
      <div className="mt-8 text-center">
        <a
          href="https://youtube.com/@vibecoding"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 inline-flex items-center gap-2 font-medium transition-colors duration-200"
        >
          {t('viewAll')}
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes slideFadeIn {
          0% {
            opacity: 0;
            transform: translateX(-60px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .videos-container {
            aspect-ratio: 2.8/1 !important;
            gap: 2px;
          }

          .video-option {
            min-width: 60px;
          }

          .video-icon {
            min-width: 30px !important;
            max-width: 30px !important;
            height: 30px !important;
          }

          .video-icon svg {
            width: 15px;
            height: 15px;
          }
        }

        @media (min-width: 1024px) {
          .videos-container {
            aspect-ratio: 5/2;
          }
        }

        .video-option {
          height: 100% !important;
          min-height: auto !important;
        }
      `}</style>
    </div>
  )
}
