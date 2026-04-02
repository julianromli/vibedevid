import { Footer } from '@/components/ui/footer'
import { Navbar } from '@/components/ui/navbar'
import { fetchProjectsWithSorting } from '@/lib/actions'
import { getCategories } from '@/lib/categories'
import { getCurrentUser } from '@/lib/server/auth'
import { ProjectListClient } from './project-list-client'

type SearchParams = Promise<{ sort?: string; filter?: string }>

export default async function ProjectListPage({ searchParams }: { searchParams: SearchParams }) {
  const { sort, filter } = await searchParams

  const initialSort = sort === 'top' || sort === 'newest' ? sort : 'trending'
  const initialFilter = filter || 'all'

  const [currentUser, { projects: initialProjects }, categories] = await Promise.all([
    getCurrentUser(),
    fetchProjectsWithSorting(initialSort, initialFilter === 'all' ? undefined : initialFilter, 100),
    getCategories(),
  ])

  const filterOptions = categories.map((cat) => ({
    value: cat.name,
    label: cat.display_name,
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
              <h1 className="mb-4 font-bold text-4xl text-foreground tracking-tight lg:text-5xl">Projects</h1>
              <p className="mx-auto max-w-2xl text-muted-foreground text-xl">
                Discover amazing projects from our community
              </p>
            </div>

            <ProjectListClient
              initialProjects={initialProjects || []}
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
