import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import HomePageData from './home-page-data'

interface HomePageSearchParams {
  filter?: string | string[]
  sort?: string | string[]
}

function HomeLoadingFallback() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-8 py-16 text-center md:py-24">
          <div className="mx-auto max-w-4xl space-y-6">
            <Skeleton className="mx-auto h-12 w-3/4 md:h-16" />
            <Skeleton className="mx-auto h-12 w-2/3 md:h-16" />
            <div className="space-y-2">
              <Skeleton className="mx-auto h-5 w-full max-w-2xl" />
              <Skeleton className="mx-auto h-5 w-5/6 max-w-xl" />
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <Skeleton className="h-11 w-36 rounded-full" />
            <Skeleton className="h-11 w-36 rounded-full" />
          </div>
        </div>
      </div>

      <section
        id="projects"
        className="py-12 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
          <div className="mb-8 space-y-4 text-center">
            <Skeleton className="mx-auto h-8 w-64" />
            <Skeleton className="mx-auto h-5 w-full max-w-xl" />
          </div>
          <div className="space-y-4">
            <div className="space-y-3 md:hidden">
              <Skeleton className="mx-auto h-10 w-full max-w-sm rounded-full" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
            <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
              <div className="justify-self-start">
                <Skeleton className="h-10 w-48 rounded-lg" />
              </div>
              <div className="justify-self-center">
                <Skeleton className="h-10 w-40 rounded-full" />
              </div>
              <div className="justify-self-end">
                <Skeleton className="h-10 w-44 rounded-lg" />
              </div>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
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
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
          <div className="mb-8 space-y-4 text-center">
            <Skeleton className="mx-auto h-8 w-64" />
            <Skeleton className="mx-auto h-5 w-full max-w-xl" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="space-y-3"
              >
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default async function HomePage({ searchParams }: { searchParams: Promise<HomePageSearchParams> }) {
  return (
    <Suspense fallback={<HomeLoadingFallback />}>
      <HomePageData searchParams={searchParams} />
    </Suspense>
  )
}
