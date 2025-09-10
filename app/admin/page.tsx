import { VideoVibeCodingManager } from '@/components/ui/video-vibe-coding-manager'

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-grid-pattern relative">
      {/* Layer 1: Background Gradient Overlay - MANDATORY */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80"></div>
      
      {/* Layer 2: Content Container - MANDATORY */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              Admin Dashboard 🚀
            </h1>
            <p className="text-xl text-muted-foreground">
              Manage Video Vibe Coding Section
            </p>
          </div>

          {/* Video Vibe Coding Manager */}
          <VideoVibeCodingManager />
        </div>
      </div>
    </div>
  )
}
