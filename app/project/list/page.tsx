import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import ProjectListData from './project-list-data'

type SearchParams = Promise<{ sort?: string; filter?: string }>

function ProjectListLoadingFallback() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative min-h-screen bg-grid-pattern">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80"></div>

        <nav className="h-16 w-full border-b bg-background/80 backdrop-blur-md" />

        <section className="relative bg-transparent py-12 pt-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Page header */}
            <div className="mb-12 text-center">
              <Skeleton className="mx-auto mb-4 h-10 w-64 md:h-12" />
              <Skeleton className="mx-auto h-6 w-full max-w-2xl" />
            </div>

            {/* Filter bar */}
            <div className="mb-8">
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

            {/* Project grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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

        <footer className="border-t bg-background py-12">
          <div className="mx-auto max-w-7xl px-4">
            <Skeleton className="mx-auto h-5 w-64" />
            <Skeleton className="mx-auto mt-2 h-4 w-48" />
          </div>
        </footer>
      </div>
    </div>
  )
}

export default function ProjectListPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<ProjectListLoadingFallback />}>
      <ProjectListData searchParams={searchParams} />
    </Suspense>
  )
}
