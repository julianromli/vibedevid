'use client'

import { Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { FilterControls } from '@/components/ui/filter-controls'
import { HeartButtonDisplay } from '@/components/ui/heart-button-display'
import { OptimizedAvatar } from '@/components/ui/optimized-avatar'
import { ProjectGridSkeleton } from '@/components/ui/skeleton'
import { UserDisplayName } from '@/components/ui/user-display-name'
import { useProjectFilters } from '@/hooks/useProjectFilters'
import type { ProjectFilterOption, SortBy } from '@/types/homepage'

interface ProjectListClientProps {
  initialProjects: Array<{
    id: string
    slug: string
    title: string
    description: string
    image: string
    author: {
      name: string
      username: string
      role: number | null
      avatar: string
    }
    url: string | undefined
    category: string
    likes: number
    views: number
    createdAt: string
  }>
  initialFilter: string
  initialSort: SortBy
  filterOptions: ProjectFilterOption[]
}

export function ProjectListClient({
  initialProjects,
  initialFilter,
  initialSort,
  filterOptions,
}: ProjectListClientProps) {
  const t = useTranslations('projectList')
  const tCommon = useTranslations('common')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const {
    selectedFilter,
    setSelectedFilter,
    selectedTrending,
    setSelectedTrending,
    visibleProjects,
    filterOptions: resolvedFilterOptions,
    projects,
    loading,
    loadMore,
  } = useProjectFilters({
    authReady: true,
    initialProjects,
    initialCategories: [{ value: 'all', label: tCommon('all') }, ...filterOptions],
    initialFilter,
    initialSort,
  })

  const visibleProjectCount = Math.min(visibleProjects, projects.length)

  const trendingOptions = [
    { value: 'trending' as SortBy, label: t('trendingOptions.trending') },
    { value: 'top' as SortBy, label: t('trendingOptions.top') },
    { value: 'newest' as SortBy, label: t('trendingOptions.newest') },
  ]

  return (
    <>
      <div className="mb-8">
        <div className="space-y-4 md:hidden">
          <div className="flex justify-center">
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 w-full max-w-sm"
            >
              <Link href="/project/submit">
                <Plus className="mr-2 h-4 w-4" />
                {t('submitButton')}
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FilterControls
              filterOptions={resolvedFilterOptions}
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
              isOpen={isFiltersOpen}
              setIsOpen={setIsFiltersOpen}
              triggerClassName="w-full justify-between"
            />

            <div className="relative">
              <select
                value={selectedTrending}
                onChange={(e) => setSelectedTrending(e.target.value as SortBy)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                aria-label="Sort projects"
              >
                {trendingOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="justify-self-start">
            <FilterControls
              filterOptions={resolvedFilterOptions}
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
              isOpen={isFiltersOpen}
              setIsOpen={setIsFiltersOpen}
            />
          </div>

          <div className="justify-self-center">
            <Button
              asChild
              className="bg-primary hover:bg-primary/90"
            >
              <Link href="/project/submit">
                <Plus className="mr-2 h-4 w-4" />
                {t('submitButton')}
              </Link>
            </Button>
          </div>

          <div className="relative justify-self-end">
            <select
              value={selectedTrending}
              onChange={(e) => setSelectedTrending(e.target.value as SortBy)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              aria-label="Sort projects"
            >
              {trendingOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <ProjectGridSkeleton count={9} />
        ) : projects.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <p className="mb-4 text-muted-foreground text-xl">{t('noProjects')}</p>
            <Button asChild>
              <Link href="/project/submit">
                <Plus className="mr-2 h-4 w-4" />
                {t('beFirst')}
              </Link>
            </Button>
          </div>
        ) : (
          projects.slice(0, visibleProjects).map((project) => (
            <div
              key={project.id}
              className="group my-4 cursor-pointer py-0"
            >
              <Link
                href={`/project/${project.slug}`}
                className="block"
              >
                <div className="relative mb-4 overflow-hidden rounded-lg bg-background shadow-md transition-all duration-300 hover:shadow-xl">
                  <AspectRatio ratio={16 / 9}>
                    <Image
                      src={project.image || '/vibedev-guest-avatar.png'}
                      alt={project.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = '/vibedev-guest-avatar.png'
                      }}
                    />
                  </AspectRatio>

                  <div className="absolute top-3 left-3">
                    <span className="rounded-full bg-black/70 px-2 py-1 text-white text-xs backdrop-blur-sm">
                      {project.category}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="line-clamp-2 py-0 font-semibold text-foreground text-lg leading-tight transition-colors duration-300 group-hover:text-primary">
                    {project.title}
                  </h3>
                </div>
              </Link>

              <div className="mt-3 flex items-center justify-between py-0">
                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/${project.author.username}`}
                    className="relative z-10 flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-80"
                  >
                    <OptimizedAvatar
                      src={project.author.avatar}
                      alt={project.author.name}
                      size="sm"
                      className="ring-2 ring-muted"
                      showSkeleton={false}
                    />
                    <UserDisplayName
                      name={project.author.name}
                      role={project.author.role}
                      className="font-medium text-muted-foreground text-sm"
                    />
                  </Link>
                </div>
                <div className="relative z-20">
                  <HeartButtonDisplay
                    likes={project.likes || 0}
                    variant="default"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && visibleProjects < projects.length && (
        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={loadMore}
            className="px-8 py-2"
          >
            {t('loadMoreButton')}
          </Button>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">{t('showingProjects', { count: visibleProjectCount })}</p>
        </div>
      )}
    </>
  )
}
