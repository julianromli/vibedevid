"use client";

import React, { useState, useEffect } from 'react';
import { Play, Calendar, Users, Code, Video } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import Image from 'next/image';

interface VideoData {
  id?: string;
  title: string;
  description: string;
  thumbnail: string;
  videoId: string;
  publishedAt: string;
  viewCount?: string;
  position?: number;
  icon: React.ReactNode;
}

// Helper function untuk determine icon berdasarkan video content
const getVideoIcon = (title: string, description: string): React.ReactNode => {
  const content = (title + ' ' + description).toLowerCase();
  
  if (content.includes('live') || content.includes('coding') || content.includes('session')) {
    return <Play size={24} className="text-white" />;
  } else if (content.includes('talk') || content.includes('diskusi') || content.includes('discussion')) {
    return <Users size={24} className="text-white" />;
  } else if (content.includes('workshop') || content.includes('tutorial') || content.includes('server')) {
    return <Code size={24} className="text-white" />;
  } else if (content.includes('challenge') || content.includes('algorithm')) {
    return <Video size={24} className="text-white" />;
  } else {
    return <Code size={24} className="text-white" />; // default
  }
};

const YouTubeVideoShowcase = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animatedVideos, setAnimatedVideos] = useState<number[]>([]);
  const [vibeVideos, setVibeVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch videos dari database
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/vibe-videos');
        
        if (!response.ok) {
          throw new Error('Failed to fetch videos');
        }
        
        const data = await response.json();
        
        // Transform data dan add icons
        const videosWithIcons = data.videos.map((video: any) => ({
          ...video,
          icon: getVideoIcon(video.title, video.description)
        }));
        
        setVibeVideos(videosWithIcons);
        setError(null);
      } catch (error) {
        console.error('Error fetching videos:', error);
        setError('Gagal memuat video. Coba refresh halaman ya!');
        
        // Fallback ke hardcoded data jika API gagal
        const fallbackVideos: VideoData[] = [
          {
            title: "Next.js Tutorial: Full Stack App Development",
            description: "Belajar membuat full stack web app dengan Next.js, Prisma, dan PostgreSQL dari nol sampai deployment.",
            thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
            videoId: "dQw4w9WgXcQ",
            publishedAt: "2024-12-20",
            viewCount: "12.5K",
            icon: <Code size={24} className="text-white" />
          },
          {
            title: "Live Coding: Building Modern Dashboard",
            description: "Session live coding bikin dashboard admin yang modern dengan React dan Tailwind CSS.",
            thumbnail: "https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg",
            videoId: "9bZkp7q19f0",
            publishedAt: "2024-12-15",
            viewCount: "8.3K",
            icon: <Play size={24} className="text-white" />
          },
          {
            title: "Vibe Dev Talk: AI in Web Development",
            description: "Diskusi mendalam tentang peran AI dalam pengembangan web modern dan masa depan coding.",
            thumbnail: "https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg",
            videoId: "jNQXAC9IVRw",
            publishedAt: "2024-12-10",
            viewCount: "15.2K",
            icon: <Users size={24} className="text-white" />
          },
          {
            title: "Workshop: TypeScript untuk React Developer",
            description: "Deep dive ke TypeScript patterns dan best practices untuk React development.",
            thumbnail: "https://img.youtube.com/vi/astISOttCQ0/maxresdefault.jpg",
            videoId: "astISOttCQ0",
            publishedAt: "2024-12-05",
            viewCount: "9.8K",
            icon: <Code size={24} className="text-white" />
          },
          {
            title: "Coding Challenge: Algorithm Problem Solving",
            description: "Challenge solve berbagai algoritma populer - dari sorting sampai dynamic programming!",
            thumbnail: "https://img.youtube.com/vi/kJpTvmborXU/maxresdefault.jpg",
            videoId: "kJpTvmborXU",
            publishedAt: "2024-11-30",
            viewCount: "22.1K",
            icon: <Video size={24} className="text-white" />
          }
        ];
        setVibeVideos(fallbackVideos);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideos();
  }, []);

  const handleVideoClick = (index: number) => {
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handlePlayVideo = (videoId: string) => {
    // Open YouTube video in new tab
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
  };

  // Animation effect untuk video cards
  useEffect(() => {
    if (vibeVideos.length === 0) return;
    
    const timers: NodeJS.Timeout[] = [];
    
    vibeVideos.forEach((_, i) => {
      const timer = setTimeout(() => {
        setAnimatedVideos(prev => [...prev, i]);
      }, 180 * i);
      timers.push(timer);
    });
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [vibeVideos]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full font-sans text-foreground">
        {/* Header Section */}
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 mb-12 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Video Vibe Coding Terbaru
          </h2>
          <p className="text-muted-foreground mt-6 text-xl max-w-2xl mx-auto">
            Nonton video tutorial, live coding session, dan podcast tech terbaru dari komunitas Vibe Coding Indonesia.
          </p>
        </div>
        
        {/* Loading skeleton */}
        <div className="w-full max-w-5xl sm:max-w-6xl mx-auto min-w-[280px] sm:min-w-[300px] rounded-xl overflow-hidden px-2 sm:px-0" style={{ height: 'auto', aspectRatio: '5/2' }}>
          <div className="flex h-full gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex-1 bg-muted/20 rounded-xl animate-pulse"
                style={{ minWidth: '60px' }}
              >
                <div className="w-full h-full bg-gradient-to-r from-muted/10 to-muted/30 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full font-sans text-foreground">
      {/* Header Section */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 mb-12 text-center">
        <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
          Video Vibe Coding Terbaru
        </h2>
        <p className="text-muted-foreground mt-6 text-xl max-w-2xl mx-auto">
          Nonton video tutorial, live coding session, dan podcast tech terbaru dari komunitas Vibe Coding Indonesia.
        </p>
        {error && (
          <p className="text-sm text-amber-600 mt-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg mx-4 sm:mx-0">
            ⚠️ {error}
          </p>
        )}
      </div>

      {/* Video Selector Container */}
      <div className="videos-container flex w-full max-w-5xl sm:max-w-6xl mx-auto min-w-[280px] sm:min-w-[300px] overflow-hidden relative rounded-xl gap-1 px-2 sm:px-0" style={{ height: 'auto', aspectRatio: '5/2' }}>
        {vibeVideos.map((video, index) => (
          <div
            key={index}
            className={`
              video-option relative overflow-hidden transition-all duration-700 ease-in-out cursor-pointer
              ${activeIndex === index ? 'active border-2 border-primary shadow-2xl' : 'border-2 border-border shadow-lg'}
            `}
            style={{
              opacity: animatedVideos.includes(index) ? 1 : 0,
              transform: animatedVideos.includes(index) ? 'translateX(0)' : 'translateX(-60px)',
              minWidth: '60px',
              borderRadius: '12px',
              backgroundColor: 'hsl(var(--muted))',
              boxShadow: activeIndex === index 
                ? '0 20px 60px rgba(0,0,0,0.25)' 
                : '0 10px 30px rgba(0,0,0,0.15)',
              flex: activeIndex === index ? '7 1 0%' : '1 1 0%',
              zIndex: activeIndex === index ? 10 : 1,
              willChange: 'flex-grow, box-shadow, transform'
            }}
            onClick={() => handleVideoClick(index)}
          >
            {/* Video Thumbnail - fill entire container */}
            <div className="absolute inset-0 w-full h-full">
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                className={`object-cover transition-all duration-700 ease-in-out rounded-xl ${
                  activeIndex === index ? 'scale-100' : 'scale-105'
                }`}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={index === 0}
                quality={85}
                onError={(e) => {
                  // Fallback to a default thumbnail if the image fails to load
                  const target = e.currentTarget as HTMLImageElement;
                  // Try local avatar first, then data URI as final fallback
                  if (target.src.includes('vibedev-guest-avatar.png')) {
                    // Final fallback - simple gradient placeholder
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmMzRjNWQiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNmNDY4MmYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgZmlsbD0idXJsKCNhKSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+VmlkZW8gVGh1bWJuYWlsPC90ZXh0Pjwvc3ZnPg==';
                  } else {
                    target.src = '/vibedev-guest-avatar.png';
                  }
                  console.warn(`Failed to load thumbnail: ${video.thumbnail}`);
                }}
              />
            </div>

            {/* Dark overlay gradient - Enhanced for better text readability */}
            <div 
              className="video-shadow absolute left-0 right-0 pointer-events-none transition-all duration-700 ease-in-out"
              style={{
                bottom: activeIndex === index ? '0' : '-60px',
                height: '160px', // Slightly taller untuk better coverage
                background: activeIndex === index 
                  ? 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.75), rgba(0,0,0,0.3), transparent)'
                  : 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2), transparent)'
              }}
            />
            
            {/* Play button overlay for non-active videos */}
            {activeIndex !== index && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black/80 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg border border-white/20">
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 text-white ml-1" />
                </div>
              </div>
            )}
            
            {/* Video info label - positioned as absolute overlay */}
            <div className="video-label absolute left-0 right-0 bottom-0 flex flex-col justify-end z-20 pointer-events-none p-4 w-full h-full">
              {/* Content positioned at bottom - no height expansion */}
              <div className="mt-auto">
                {/* Icon and basic info for collapsed state */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="video-icon min-w-[40px] max-w-[40px] h-[40px] flex items-center justify-center rounded-full bg-black/90 backdrop-blur-sm shadow-lg border border-white/30 flex-shrink-0">
                    {video.icon}
                  </div>
                  
                  {/* Extended info for active video */}
                  <div className="video-info text-white relative flex-1">
                    <div 
                      className="video-title font-bold text-sm md:text-base transition-all duration-700 ease-in-out line-clamp-2"
                      style={{
                        opacity: activeIndex === index ? 1 : 0,
                        transform: activeIndex === index ? 'translateX(0)' : 'translateX(25px)',
                        textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 1px 4px rgba(0,0,0,0.9)'
                      }}
                    >
                      {video.title}
                    </div>
                    <div 
                      className="video-desc text-xs md:text-sm text-gray-200 transition-all duration-700 ease-in-out line-clamp-2"
                      style={{
                        opacity: activeIndex === index ? 1 : 0,
                        transform: activeIndex === index ? 'translateX(0)' : 'translateX(25px)',
                        textShadow: '0 1px 6px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,1)'
                      }}
                    >
                      {video.description}
                    </div>
                    {/* Video metadata */}
                    <div 
                      className="video-meta text-xs text-gray-300 mt-1 flex items-center gap-2 transition-all duration-700 ease-in-out"
                      style={{
                        opacity: activeIndex === index ? 1 : 0,
                        transform: activeIndex === index ? 'translateX(0)' : 'translateX(25px)',
                        textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,1)'
                      }}
                    >
                      <span>{formatDate(video.publishedAt)}</span>
                      {video.viewCount && (
                        <>
                          <span>•</span>
                          <span>{video.viewCount} views</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Play button for active video */}
                {activeIndex === index && (
                  <div 
                    className="transition-all duration-700 ease-in-out"
                    style={{
                      opacity: activeIndex === index ? 1 : 0,
                      transform: activeIndex === index ? 'translateY(0)' : 'translateY(15px)'
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayVideo(video.videoId);
                      }}
                      className="pointer-events-auto bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 sm:py-2 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 transition-colors duration-200 min-h-[36px] sm:min-h-[40px] touch-manipulation"
                    >
                      <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline sm:inline">Tonton</span> Video
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* View All Videos Link */}
      <div className="text-center mt-8">
        <a
          href="https://youtube.com/@vibecoding"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors duration-200"
        >
          Lihat Semua Video di Channel Kami
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        @media (max-width: 640px) {
          .videos-container {
            min-width: 280px;
            aspect-ratio: 3/2 !important;
            gap: 3px;
            padding: 0 8px;
          }
          
          .video-option {
            min-width: 70px;
            border-radius: 8px;
          }
          
          .video-icon {
            min-width: 32px !important;
            max-width: 32px !important;
            height: 32px !important;
          }
          
          .video-icon svg {
            width: 16px;
            height: 16px;
          }
          
          .video-title {
            font-size: 0.875rem !important;
            line-height: 1.25rem !important;
          }
          
          .video-desc {
            font-size: 0.75rem !important;
            line-height: 1rem !important;
          }
          
          .video-meta {
            font-size: 0.6875rem !important;
          }
        }
        
        @media (min-width: 641px) and (max-width: 768px) {
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
        
        @media (min-width: 769px) {
          .videos-container {
            aspect-ratio: 5/2;
          }
        }
        
        /* Ensure cards fill height perfectly */
        .video-option {
          height: 100% !important;
          min-height: auto !important;
        }
      `}</style>
    </div>
  );
};

export default YouTubeVideoShowcase;
