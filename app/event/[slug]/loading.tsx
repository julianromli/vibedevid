import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { AspectRatio } from '@/components/ui/aspect-ratio'

export default function EventDetailLoading() {
  return (
    <div className="bg-grid-pattern relative min-h-screen">
      {/* Background Gradient Overlay */}
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>

      {/* Content Container */}
      <div className="relative mx-auto max-w-6xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
        {/* Back Navigation Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-9 w-32" />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Cover Image Skeleton */}
            <div className="bg-muted relative overflow-hidden rounded-xl">
              <AspectRatio ratio={16 / 9}>
                <Skeleton className="h-full w-full" />
              </AspectRatio>
            </div>

            {/* Event Header Skeleton */}
            <div className="space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>

              {/* Title */}
              <Skeleton className="h-10 w-3/4" />

              {/* Event Info */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <Skeleton className="h-5 w-64" />
                </div>
                <div className="flex items-start gap-3">
                  <Skeleton className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <Skeleton className="h-5 w-80" />
                </div>
                <div className="flex items-start gap-3">
                  <Skeleton className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <Skeleton className="h-5 w-48" />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration CTA Skeleton */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-11 w-full" />
              </CardContent>
            </Card>

            {/* Share Button Skeleton */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Events Skeleton */}
        <div className="mt-16">
          <Skeleton className="mb-6 h-8 w-48" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <AspectRatio ratio={16 / 9}>
                    <Skeleton className="h-full w-full rounded-t-lg" />
                  </AspectRatio>
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
