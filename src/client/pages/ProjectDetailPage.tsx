'use client'

import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Navbar } from '@/components/ui/navbar'
import { Footer } from '@/components/ui/footer'

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading } = useQuery({
    queryKey: ['project', slug],
    queryFn: async () => {
      const res = await fetch(`/api/pages/project/${slug}`)
      if (!res.ok) throw new Error('Failed to load')
      return res.json()
    },
    enabled: !!slug,
  })

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
  }

  const project = data?.project
  if (!project) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p>Project not found.</p>
          <Link to="/project/list" className="text-primary underline">Back to projects</Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-4 text-3xl font-bold">{project.title}</h1>
        {project.tagline && <p className="mb-6 text-lg text-muted-foreground">{project.tagline}</p>}
        <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">{project.description}</div>
      </main>
      <Footer />
    </div>
  )
}
