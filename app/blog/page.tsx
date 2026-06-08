import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import BlogPageData from './blog-page-data'

function BlogLoadingFallback() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="h-16 w-full border-b bg-background/80 backdrop-blur-md" />

      <main className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
              <div>
                <Skeleton className="mb-4 h-12 w-48 md:h-16" />
                <Skeleton className="h-6 w-full max-w-2xl" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="space-y-4"
              >
                <div className="bg-muted relative overflow-hidden rounded-lg">
                  <div className="aspect-video">
                    <Skeleton className="h-full w-full" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="flex items-center gap-3 pt-1">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-14 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function BlogPage() {
  return (
    <Suspense fallback={<BlogLoadingFallback />}>
      <BlogPageData />
    </Suspense>
  )
}
