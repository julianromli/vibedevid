'use client'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'

export default function EventListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => fetch('/api/pages/events').then((r) => r.json()),
  })
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">Events</h1>
        {isLoading ? (
          <p>Loading…</p>
        ) : (
          <ul className="space-y-4">
            {(data?.events ?? []).map((e: { id: string; slug: string; title: string }) => (
              <li key={e.id}>
                <Link
                  className="text-primary hover:underline"
                  to={`/event/${e.slug}`}
                >
                  {e.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  )
}
