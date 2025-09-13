'use client'

// Mobile-Optimized Loading Skeletons untuk Better UX
// Lightweight dan performance-first skeletons

export const ProjectCardSkeleton = () => (
  <div className="bg-card animate-pulse rounded-lg border">
    <div className="bg-muted aspect-video rounded-t-lg" />
    <div className="space-y-3 p-4">
      <div className="bg-muted h-4 w-3/4 rounded" />
      <div className="bg-muted h-3 w-1/2 rounded" />
      <div className="flex items-center justify-between">
        <div className="bg-muted h-3 w-1/4 rounded" />
        <div className="bg-muted h-6 w-6 rounded-full" />
      </div>
    </div>
  </div>
)

export const TestimonialSkeleton = () => (
  <div className="bg-card animate-pulse space-y-3 rounded-lg border p-4">
    <div className="flex items-center gap-3">
      <div className="bg-muted h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-1">
        <div className="bg-muted h-3 w-1/3 rounded" />
        <div className="bg-muted h-2 w-1/4 rounded" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="bg-muted h-3 rounded" />
      <div className="bg-muted h-3 w-4/5 rounded" />
    </div>
  </div>
)

export const IntegrationCardSkeleton = () => (
  <div className="bg-card animate-pulse rounded-lg border p-6">
    <div className="bg-muted mb-4 h-10 w-10 rounded" />
    <div className="mb-4 space-y-2">
      <div className="bg-muted h-4 w-2/3 rounded" />
      <div className="bg-muted h-3 rounded" />
      <div className="bg-muted h-3 w-3/4 rounded" />
    </div>
    <div className="border-t border-dashed pt-4">
      <div className="bg-muted h-8 w-20 rounded" />
    </div>
  </div>
)

export const SafariSkeleton = () => (
  <div className="relative w-full animate-pulse rounded-xl bg-gray-100">
    {/* Browser Chrome */}
    <div className="flex items-center justify-between border-b border-gray-300 bg-gray-200 px-4 py-3">
      <div className="flex items-center space-x-2">
        <div className="h-3 w-3 rounded-full bg-gray-400"></div>
        <div className="h-3 w-3 rounded-full bg-gray-400"></div>
        <div className="h-3 w-3 rounded-full bg-gray-400"></div>
      </div>
      <div className="mx-4 flex-1">
        <div className="h-6 rounded-md bg-white px-3 py-1"></div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="h-6 w-6 rounded bg-gray-300"></div>
        <div className="h-6 w-6 rounded bg-gray-300"></div>
      </div>
    </div>
    {/* Content Skeleton */}
    <div className="space-y-4 bg-white p-8">
      <div className="bg-muted h-8 w-3/4 rounded" />
      <div className="bg-muted h-4 rounded" />
      <div className="bg-muted h-4 w-4/5 rounded" />
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-muted h-20 rounded" />
        <div className="bg-muted h-20 rounded" />
        <div className="bg-muted h-20 rounded" />
      </div>
    </div>
  </div>
)

export const HeroSkeleton = () => (
  <div className="animate-pulse space-y-6 text-center">
    <div className="space-y-4">
      <div className="bg-muted mx-auto h-12 w-3/4 rounded" />
      <div className="bg-muted mx-auto h-6 w-2/3 rounded" />
    </div>
    <div className="flex justify-center gap-4">
      <div className="bg-muted h-10 w-32 rounded" />
      <div className="bg-muted h-10 w-28 rounded" />
    </div>
  </div>
)

// Optimized untuk mobile - minimal DOM nodes
export const CompactSkeleton = () => (
  <div className="animate-pulse space-y-2">
    <div className="bg-muted h-4 rounded" />
    <div className="bg-muted h-4 w-3/4 rounded" />
  </div>
)

// Grid skeleton untuk project showcase
export const ProjectGridSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <ProjectCardSkeleton key={i} />
    ))}
  </div>
)

// Testimonials grid skeleton
export const TestimonialsGridSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
    {Array.from({ length: 4 }).map((_, i) => (
      <TestimonialSkeleton key={i} />
    ))}
  </div>
)

// Integration cards grid skeleton
export const IntegrationGridSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <IntegrationCardSkeleton key={i} />
    ))}
  </div>
)
