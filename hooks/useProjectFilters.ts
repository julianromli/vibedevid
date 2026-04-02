/**
 * Project filtering and sorting hook
 * Handles filter state, sorting, and data fetching
 */

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchProjectsWithSorting } from '@/lib/actions'
import { getCategories } from '@/lib/categories'
import type { Project, ProjectFilterOption, SortBy } from '@/types/homepage'

interface UseProjectFiltersOptions {
  authReady: boolean
  initialProjects?: Project[]
  initialCategories?: ProjectFilterOption[]
  initialFilter?: string
  initialSort?: SortBy
}

const ALL_FILTER_VALUE = 'all'
const DEFAULT_SORT: SortBy = 'trending'

function normalizeSortParam(value: string | null | undefined): SortBy {
  return value === 'top' || value === 'newest' || value === 'trending' ? value : DEFAULT_SORT
}

function normalizeFilterParam(value: string | null | undefined, categories: ProjectFilterOption[]): string {
  if (!value || value === ALL_FILTER_VALUE) {
    return ALL_FILTER_VALUE
  }

  return categories.some((category) => category.value === value) ? value : ALL_FILTER_VALUE
}

export function useProjectFilters({
  authReady,
  initialProjects = [],
  initialCategories = [],
  initialFilter = ALL_FILTER_VALUE,
  initialSort = DEFAULT_SORT,
}: UseProjectFiltersOptions) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [selectedFilter, setSelectedFilter] = useState(initialFilter)
  const [selectedTrending, setSelectedTrending] = useState<SortBy>(initialSort)
  const [visibleProjects, setVisibleProjects] = useState(6)
  const [filterOptions, setFilterOptions] = useState<ProjectFilterOption[]>(initialCategories)
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [loading, setLoading] = useState(initialProjects.length === 0)
  const [skipInitialFetch, setSkipInitialFetch] = useState(initialProjects.length > 0)

  // Fetch categories for filter options
  useEffect(() => {
    if (initialCategories.length > 0) {
      return
    }

    const fetchFilterCategories = async () => {
      try {
        const categories = await getCategories()
        setFilterOptions(
          categories.map((category) => ({
            value: category.name,
            label: category.display_name,
          })),
        )
      } catch (error) {
        console.error('Failed to fetch categories for filters:', error)
      }
    }

    fetchFilterCategories()
  }, [initialCategories])

  useEffect(() => {
    const nextSort = normalizeSortParam(searchParams.get('sort'))
    const nextFilter = normalizeFilterParam(searchParams.get('filter'), filterOptions)

    setSelectedTrending((current) => (current === nextSort ? current : nextSort))
    setSelectedFilter((current) => (current === nextFilter ? current : nextFilter))
  }, [filterOptions, searchParams])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    params.set('sort', selectedTrending)
    params.set('filter', selectedFilter)

    const nextQuery = params.toString()
    const currentQuery = searchParams.toString()

    if (nextQuery !== currentQuery) {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false })
    }
  }, [pathname, router, searchParams, selectedFilter, selectedTrending])

  // Fetch projects with sorting
  useEffect(() => {
    if (!authReady) {
      return
    }

    if (skipInitialFetch && selectedTrending === initialSort && selectedFilter === initialFilter) {
      setSkipInitialFetch(false)
      return
    }

    const fetchProjects = async () => {
      try {
        setLoading(true)

        // Fetch projects with new sorting function
        const { projects: fetchedProjects, error } = await fetchProjectsWithSorting(
          selectedTrending,
          selectedFilter === ALL_FILTER_VALUE ? undefined : selectedFilter,
          20, // limit
        )

        if (error) {
          console.error('Error fetching projects:', error)
          return
        }

        setProjects(fetchedProjects || [])
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [authReady, initialFilter, initialSort, selectedTrending, selectedFilter, skipInitialFetch])

  const loadMore = () => {
    setVisibleProjects((prev) => prev + 6)
  }

  return {
    selectedFilter,
    setSelectedFilter,
    selectedTrending,
    setSelectedTrending,
    visibleProjects,
    filterOptions,
    projects,
    loading,
    loadMore,
  }
}
