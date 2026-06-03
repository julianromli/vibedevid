'use client'

import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { PageLoadingShell } from '@/src/client/components/PageLoadingShell'
import ProjectDetailClient from '@/components/project/project-detail-client'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'

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
    return <PageLoadingShell />
  }

  const project = data?.project
  if (!project) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p>Project not found.</p>
          <Link
            to="/project/list"
            className="text-primary underline"
          >
            Back to projects
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  if (!slug) {
    return null
  }

  return (
    <ProjectDetailClient
      slug={slug}
      project={project}
      initialComments={data.comments ?? []}
      categories={data.categories ?? []}
      currentUser={data.currentUser ?? null}
      isOwner={data.isOwner ?? false}
    />
  )
}
