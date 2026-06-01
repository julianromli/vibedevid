'use client'

import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import ProjectDetailClient from '@/components/project/project-detail-client'
import { Navbar } from '@/components/ui/navbar'
import { Footer } from '@/components/ui/footer'

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading } = useQuery({
    queryKey: ['project', slug],
    queryFn: async () => {
      const res = await fetch(`/api/pages/project/${slug}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load')
      return res.json()
    },
    enabled: !!slug,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const project = data?.project
  if (!project) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p>Project not found.</p>
          <Link to="/project/list" className="text-primary underline">
            Back to projects
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <ProjectDetailClient
      slug={slug!}
      project={project}
      initialComments={data.comments ?? []}
      categories={data.categories ?? []}
      currentUser={data.currentUser ?? null}
      isOwner={data.isOwner ?? false}
    />
  )
}
