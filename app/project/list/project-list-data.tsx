import { getTranslations } from '@/lib/i18n-server'
import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import { fetchProjectsWithSorting } from '@/lib/actions'
import { getCategories } from '@/lib/categories'
import { getCurrentUser } from '@/lib/server/auth'
import { ProjectListClient } from './project-list-client'

type SearchParams = Promise<{ sort?: string | string[]; filter?: string | string[] }>
type ProjectSort = 'top' | 'newest' | 'trending'

const PROJECT_SORTS = ['top', 'newest', 'trending'] as const

function getSingleSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function normalizeSortParam(value: string | undefined): ProjectSort {
  return PROJECT_SORTS.includes(value as ProjectSort) ? (value as ProjectSort) : 'trending'
}

export default async function ProjectListData({ searchParams }: { searchParams: SearchParams }) {
  const { sort, filter } = await searchParams
  const [t, currentUser, categories] = await Promise.all([
    getTranslations('projectList'),
    getCurrentUser(),
    getCategories(),
  ])

  const initialSort = normalizeSortParam(getSingleSearchParam(sort))
  const requestedFilter = getSingleSearchParam(filter)
  const initialFilter =
    requestedFilter && categories.some((category) => category.name === requestedFilter) ? requestedFilter : 'all'

  const { projects: initialProjects } = await fetchProjectsWithSorting(
    initialSort,
    initialFilter === 'all' ? undefined : initialFilter,
    100,
  )

  const filterOptions = categories.map((cat) => ({
    value: cat.name,
    label: cat.display_name,
  }))
  const normalizedProjects = (initialProjects ?? []).map((project) => ({
    ...project,
    image: project.image ?? '/vibedev-guest-avatar.png',
  }))

  const user = currentUser
    ? {
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar,
        username: currentUser.username,
        role: currentUser.role,
      }
    : null

  return (
    <div className="min-h-screen bg-background">
      <div className="relative min-h-screen bg-grid-pattern">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80"></div>

        <Navbar
          showNavigation={true}
          isLoggedIn={!!currentUser}
          user={user ?? undefined}
        />

        <section className="relative bg-transparent py-12 pt-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h1 className="mb-4 font-bold text-4xl text-foreground tracking-tight lg:text-5xl">{t('title')}</h1>
              <p className="mx-auto max-w-2xl text-muted-foreground text-xl">{t('description')}</p>
            </div>

            <ProjectListClient
              initialProjects={normalizedProjects}
              initialFilter={initialFilter}
              initialSort={initialSort}
              filterOptions={filterOptions}
            />
          </div>
        </section>

        <Footer />
      </div>
    </div>
  )
}
