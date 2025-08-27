import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Project Image Skeleton
function ProjectImageSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-muted">
      <div className="aspect-video">
        <Skeleton className="w-full h-full" />
      </div>
    </div>
  )
}

// Project Info Skeleton
function ProjectInfoSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-6 w-5/6" />
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      {/* About section */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </div>

      {/* Project URL */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  )
}

// Comments Section Skeleton
function CommentsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-6 w-32" />
      </div>
      
      {/* Add comment form */}
      <div className="border rounded-lg p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <div className="flex justify-end">
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Project Stats Skeleton
function ProjectStatsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Author Card */}
      <div className="border rounded-lg p-6">
        <div className="text-center space-y-4">
          <Skeleton className="h-20 w-20 rounded-full mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 mx-auto" />
            <Skeleton className="h-4 w-40 mx-auto" />
            <Skeleton className="h-3 w-28 mx-auto" />
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      {/* Stats Card */}
      <div className="border rounded-lg p-6">
        <Skeleton className="h-5 w-24 mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Actions Card */}
      <div className="border rounded-lg p-6">
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  )
}

// Profile Header Skeleton
function ProfileHeaderSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-8 mb-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar */}
        <Skeleton className="h-24 w-24 rounded-full mx-auto md:mx-0" />

        {/* User Info */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 mx-auto md:mx-0" />
            <Skeleton className="h-5 w-32 mx-auto md:mx-0" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full max-w-2xl mx-auto md:mx-0" />
              <Skeleton className="h-4 w-3/4 max-w-xl mx-auto md:mx-0" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          <div className="flex gap-4 justify-center md:justify-start">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex md:flex-col gap-6 md:gap-3 justify-center md:justify-start md:items-end">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-muted/30 rounded-xl p-4 text-center min-w-[80px]">
              <Skeleton className="h-8 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Project Grid Skeleton - Reusable grid skeleton
interface ProjectGridSkeletonProps {
  count?: number
  columns?: number
}

function ProjectGridSkeleton({ count = 6, columns = 3 }: ProjectGridSkeletonProps) {
  const gridCols = columns === 2 ? "md:grid-cols-2" : columns === 3 ? "md:grid-cols-3" : `md:grid-cols-${columns}`
  
  return (
    <div className={`grid ${gridCols} gap-6`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="relative overflow-hidden rounded-lg bg-muted">
            <div className="aspect-video">
              <Skeleton className="w-full h-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Profile Projects Grid Skeleton (specific for profile page)
function ProfileProjectsSkeleton() {
  return (
    <div className="border rounded-lg">
      <div className="p-6">
        <Skeleton className="h-6 w-20 mb-6" />
        <ProjectGridSkeleton count={4} columns={2} />
      </div>
    </div>
  )
}

export {
  Skeleton,
  ProjectImageSkeleton,
  ProjectInfoSkeleton,
  CommentsSkeleton,
  ProjectStatsSkeleton,
  ProfileHeaderSkeleton,
  ProfileProjectsSkeleton,
  ProjectGridSkeleton,
}
