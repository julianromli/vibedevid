import { getAllProjects, getProjectCategories } from '@/lib/actions/admin/projects'
import { ProjectFilters } from './components/project-filters'
import { ProjectsTable } from './components/projects-table'

interface SearchParams {
  status?: string
  category?: string
  search?: string
  page?: string
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams

  const filters = {
    status: params.status as 'all' | 'featured' | 'regular' | undefined,
    category: params.category,
    search: params.search,
  }

  const page = params.page ? parseInt(params.page, 10) : 1

  const [{ projects, totalCount, error }, { categories }] = await Promise.all([
    getAllProjects(filters, page, 20),
    getProjectCategories(),
  ])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive">Failed to load projects</div>
        <div className="text-sm text-muted-foreground mt-1">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ProjectFilters categories={categories} />
      <ProjectsTable
        projects={projects}
        totalCount={totalCount}
        currentPage={page}
      />
    </div>
  )
}
