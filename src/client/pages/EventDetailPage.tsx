'use client'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { Navbar } from '@/components/ui/navbar'
import { Footer } from '@/components/ui/footer'

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading } = useQuery({
    queryKey: ['event', slug],
    queryFn: () => fetch(`/api/pages/event/${slug}`).then((r) => r.json()),
    enabled: !!slug,
  })
  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
  const event = data?.event
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        {!event ? <p>Event not found. <Link to="/event/list">Back</Link></p> : <>
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <p className="mt-4 whitespace-pre-wrap">{event.description}</p>
        </>}
      </main>
      <Footer />
    </div>
  )
}
