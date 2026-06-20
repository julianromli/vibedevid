import { VideoVibeCodingManager } from "@/components/ui/video-vibe-coding-manager";

export default function AdminPage() {
  return (
    <div className="bg-grid-pattern relative min-h-screen">
      {/* Layer 1: Background Gradient Overlay - MANDATORY */}
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>

      {/* Layer 2: Content Container - MANDATORY */}
      <div className="relative mx-auto max-w-6xl px-3 pt-20 pb-8 sm:px-6 sm:pt-24 lg:px-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="space-y-2 text-center sm:space-y-4">
            <h1 className="text-foreground text-2xl font-bold sm:text-4xl">Admin Dashboard 🚀</h1>
            <p className="text-muted-foreground text-base sm:text-xl">
              Manage Video Vibe Coding Section
            </p>
          </div>

          {/* Video Vibe Coding Manager */}
          <VideoVibeCodingManager />
        </div>
      </div>
    </div>
  );
}
