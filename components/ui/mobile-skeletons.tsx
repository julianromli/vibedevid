'use client'

// Mobile-Optimized Loading Skeletons untuk Better UX
// Lightweight dan performance-first skeletons

export const ProjectCardSkeleton = () => (
  <div className="rounded-lg border bg-card animate-pulse">
    <div className="aspect-video bg-muted rounded-t-lg" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-1/2" />
      <div className="flex items-center justify-between">
        <div className="h-3 bg-muted rounded w-1/4" />
        <div className="w-6 h-6 bg-muted rounded-full" />
      </div>
    </div>
  </div>
)

export const TestimonialSkeleton = () => (
  <div className="rounded-lg border bg-card p-4 animate-pulse space-y-3">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-muted rounded-full" />
      <div className="space-y-1 flex-1">
        <div className="h-3 bg-muted rounded w-1/3" />
        <div className="h-2 bg-muted rounded w-1/4" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-muted rounded" />
      <div className="h-3 bg-muted rounded w-4/5" />
    </div>
  </div>
)

export const IntegrationCardSkeleton = () => (
  <div className="rounded-lg border bg-card p-6 animate-pulse">
    <div className="w-10 h-10 bg-muted rounded mb-4" />
    <div className="space-y-2 mb-4">
      <div className="h-4 bg-muted rounded w-2/3" />
      <div className="h-3 bg-muted rounded" />
      <div className="h-3 bg-muted rounded w-3/4" />
    </div>
    <div className="border-t border-dashed pt-4">
      <div className="h-8 bg-muted rounded w-20" />
    </div>
  </div>
)

export const SafariSkeleton = () => (
  <div className="relative w-full bg-gray-100 rounded-xl animate-pulse">
    {/* Browser Chrome */}
    <div className="flex items-center justify-between px-4 py-3 bg-gray-200 border-b border-gray-300">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
      </div>
      <div className="flex-1 mx-4">
        <div className="bg-white rounded-md px-3 py-1 h-6"></div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-gray-300 rounded"></div>
        <div className="w-6 h-6 bg-gray-300 rounded"></div>
      </div>
    </div>
    {/* Content Skeleton */}
    <div className="bg-white p-8 space-y-4">
      <div className="h-8 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded" />
      <div className="h-4 bg-muted rounded w-4/5" />
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="h-20 bg-muted rounded" />
        <div className="h-20 bg-muted rounded" />
        <div className="h-20 bg-muted rounded" />
      </div>
    </div>
  </div>
)

export const HeroSkeleton = () => (
  <div className="text-center space-y-6 animate-pulse">
    <div className="space-y-4">
      <div className="h-12 bg-muted rounded w-3/4 mx-auto" />
      <div className="h-6 bg-muted rounded w-2/3 mx-auto" />
    </div>
    <div className="flex justify-center gap-4">
      <div className="h-10 bg-muted rounded w-32" />
      <div className="h-10 bg-muted rounded w-28" />
    </div>
  </div>
)

// Optimized untuk mobile - minimal DOM nodes
export const CompactSkeleton = () => (
  <div className="animate-pulse space-y-2">
    <div className="h-4 bg-muted rounded" />
    <div className="h-4 bg-muted rounded w-3/4" />
  </div>
)

// Grid skeleton untuk project showcase
export const ProjectGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <ProjectCardSkeleton key={i} />
    ))}
  </div>
)

// Testimonials grid skeleton
export const TestimonialsGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <TestimonialSkeleton key={i} />
    ))}
  </div>
)

// Integration cards grid skeleton  
export const IntegrationGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <IntegrationCardSkeleton key={i} />
    ))}
  </div>
)
