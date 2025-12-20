import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('bg-muted animate-pulse rounded-md', className)}
      {...props}
    />
  )
}

// Project Image Skeleton
function ProjectImageSkeleton() {
  return (
    <div className="bg-muted relative overflow-hidden rounded-xl">
      <div className="aspect-video">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  )
}

// Project Info Skeleton
function ProjectInfoSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
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
      <div className="rounded-lg border p-4">
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
      <div className="space-y-4 rounded-lg border p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <div className="flex justify-end">
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg border p-4"
          >
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
      <div className="rounded-lg border p-6">
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="mx-auto h-5 w-32" />
            <Skeleton className="mx-auto h-4 w-40" />
            <Skeleton className="mx-auto h-3 w-28" />
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      {/* Stats Card */}
      <div className="rounded-lg border p-6">
        <Skeleton className="mb-4 h-5 w-24" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between"
            >
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Actions Card */}
      <div className="rounded-lg border p-6">
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  )
}

// Profile Header Skeleton
function ProfileHeaderSkeleton() {
  return (
    <div className="bg-card border-border mb-8 rounded-xl border p-8">
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Avatar */}
        <Skeleton className="mx-auto h-24 w-24 rounded-full md:mx-0" />

        {/* User Info */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="space-y-2">
            <Skeleton className="mx-auto h-8 w-64 md:mx-0" />
            <Skeleton className="mx-auto h-5 w-32 md:mx-0" />
            <div className="space-y-2">
              <Skeleton className="mx-auto h-4 w-full max-w-2xl md:mx-0" />
              <Skeleton className="mx-auto h-4 w-3/4 max-w-xl md:mx-0" />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:justify-start">
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          <div className="flex justify-center gap-4 md:justify-start">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-6 md:flex-col md:items-end md:justify-start md:gap-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-muted/30 min-w-[80px] rounded-xl p-4 text-center"
            >
              <Skeleton className="mx-auto mb-1 h-8 w-8" />
              <Skeleton className="mx-auto h-3 w-12" />
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
  const gridCols = columns === 2 ? 'md:grid-cols-2' : columns === 3 ? 'md:grid-cols-3' : `md:grid-cols-${columns}`

  return (
    <div className={`grid ${gridCols} gap-6`}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="space-y-4"
        >
          <div className="bg-muted relative overflow-hidden rounded-lg">
            <div className="aspect-video">
              <Skeleton className="h-full w-full" />
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
    <div className="rounded-lg border">
      <div className="p-6">
        <Skeleton className="mb-6 h-6 w-20" />
        <ProjectGridSkeleton
          count={4}
          columns={2}
        />
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
