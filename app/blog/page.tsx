import { Suspense } from 'react'
import { BlogGridSkeleton, BlogHeaderSkeleton } from '@/components/ui/skeleton'
import BlogPageData from './blog-page-data'

export const revalidate = 60

function BlogLoadingFallback() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="h-16 w-full border-b bg-background/80 backdrop-blur-md" />

      <main className="py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <BlogHeaderSkeleton />
          <BlogGridSkeleton />
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
