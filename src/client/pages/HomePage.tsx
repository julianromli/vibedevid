import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import HomePageClient from '@/app/home-page-client'
import type { Project, ProjectFilterOption, SortBy, User, VibeVideo } from '@/types/homepage'

async function fetchHomeData(filter?: string | null, sort?: string | null) {
  const params = new URLSearchParams()
  if (filter) params.set('filter', filter)
  if (sort) params.set('sort', sort)
  const res = await fetch(`/api/pages/home?${params}`)
  if (!res.ok) throw new Error('Failed to load homepage')
  return res.json() as Promise<{
    initialIsLoggedIn: boolean
    initialUser: User | null
    initialProjects: Project[]
    initialCategories: ProjectFilterOption[]
    initialFilter: string
    initialSort: SortBy
    initialVibeVideos: VibeVideo[]
  }>
}

export default function HomePage() {
  const [searchParams] = useSearchParams()
  const filter = searchParams.get('filter')
  const sort = searchParams.get('sort')

  const { data, isLoading } = useQuery({
    queryKey: ['home', filter, sort],
    queryFn: () => fetchHomeData(filter, sort),
  })

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <HomePageClient
      initialIsLoggedIn={data.initialIsLoggedIn}
      initialUser={data.initialUser}
      initialProjects={data.initialProjects}
      initialCategories={data.initialCategories}
      initialFilter={data.initialFilter}
      initialSort={data.initialSort}
      initialVibeVideos={data.initialVibeVideos}
    />
  )
}
