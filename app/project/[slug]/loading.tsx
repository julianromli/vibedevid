import {
  CommentsSkeleton,
  ProjectImageSkeleton,
  ProjectInfoSkeleton,
  ProjectStatsSkeleton,
  Skeleton,
} from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const loadingSections = {
  hero: 'animate-detail-skeleton-enter',
  content: 'animate-detail-skeleton-enter [animation-delay:80ms]',
  comments: 'animate-detail-skeleton-enter [animation-delay:180ms]',
  sidebarPrimary: 'animate-detail-skeleton-enter [animation-delay:120ms]',
  sidebarSecondary: 'animate-detail-skeleton-enter [animation-delay:220ms]',
}

function ShareSkeleton() {
  return (
    <div className="rounded-lg border p-6">
      <Skeleton className="h-9 w-full" />
    </div>
  )
}

export default function ProjectDetailsLoading() {
  return (
    <div className="bg-grid-pattern relative min-h-screen">
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b" />

      <nav className="bg-background/80 h-16 w-full border-b backdrop-blur-md" />

      <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <main className="space-y-8 lg:col-span-2">
            <section className={cn(loadingSections.hero, 'motion-reduce:animate-none')}>
              <ProjectImageSkeleton />
            </section>

            <section className={cn(loadingSections.content, 'motion-reduce:animate-none')}>
              <ProjectInfoSkeleton />
            </section>

            <section className={cn(loadingSections.comments, 'motion-reduce:animate-none')}>
              <CommentsSkeleton />
            </section>
          </main>

          <aside className="space-y-6">
            <section className={cn(loadingSections.sidebarPrimary, 'motion-reduce:animate-none')}>
              <ProjectStatsSkeleton />
            </section>

            <section className={cn(loadingSections.sidebarSecondary, 'motion-reduce:animate-none')}>
              <ShareSkeleton />
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
