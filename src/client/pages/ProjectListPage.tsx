'use client'

import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ProjectListClient } from '@/src/client/features/project/ProjectListClient'
import type { ProjectFilterOption, SortBy } from '@/types/homepage'

async function fetchProjectList(filter: string | null, sort: string | null) {
  const params = new URLSearchParams()
  if (filter) params.set('filter', filter)
  if (sort) params.set('sort', sort)
  const res = await fetch(`/api/pages/project-list?${params}`)
  if (!res.ok) throw new Error('Failed to load projects')
  return res.json()
}

export default function ProjectListPage() {
  const [searchParams] = useSearchParams()
  const filter = searchParams.get('filter')
  const sort = searchParams.get('sort')

  const { data, isLoading } = useQuery({
    queryKey: ['project-list', filter, sort],
    queryFn: () => fetchProjectList(filter, sort),
  })

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <ProjectListClient
      initialProjects={data.initialProjects}
      initialFilter={data.initialFilter}
      initialSort={data.initialSort as SortBy}
      filterOptions={data.filterOptions as ProjectFilterOption[]}
    />
  )
}
