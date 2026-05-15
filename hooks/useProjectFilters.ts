/**
 * Project filtering and sorting hook
 * Handles filter state, sorting, and data fetching
 */

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
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
const PROJECT_FETCH_TIMEOUT_MS = 10_000

type FetchProjectsResult = Awaited<ReturnType<typeof fetchProjectsWithSorting>>

function normalizeSortParam(value: string | null | undefined): SortBy {
  return value === 'top' || value === 'newest' || value === 'trending' ? value : DEFAULT_SORT
}

function normalizeFilterParam(value: string | null | undefined, categories: ProjectFilterOption[]): string {
  if (!value || value === ALL_FILTER_VALUE) {
    return ALL_FILTER_VALUE
  }

  return categories.some((category) => category.value === value) ? value : ALL_FILTER_VALUE
}

async function fetchProjectsWithTimeout(sortBy: SortBy, category?: string): Promise<FetchProjectsResult> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      fetchProjectsWithSorting(sortBy, category, 20),
      new Promise<FetchProjectsResult>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Project fetch timed out after ${PROJECT_FETCH_TIMEOUT_MS}ms`))
        }, PROJECT_FETCH_TIMEOUT_MS)
      }),
    ])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
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
  const shouldSkipInitialFetchRef = useRef(initialProjects.length > 0)
  const latestRequestIdRef = useRef(0)

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

  // Fetch projects with sorting while ignoring stale responses.
  useEffect(() => {
    if (!authReady) {
      return
    }

    if (
      shouldSkipInitialFetchRef.current &&
      selectedTrending === initialSort &&
      selectedFilter === initialFilter
    ) {
      shouldSkipInitialFetchRef.current = false
      return
    }

    const requestId = latestRequestIdRef.current + 1
    latestRequestIdRef.current = requestId
    let isActive = true

    const fetchProjects = async () => {
      try {
        setLoading(true)

        const { projects: fetchedProjects, error } = await fetchProjectsWithTimeout(
          selectedTrending,
          selectedFilter === ALL_FILTER_VALUE ? undefined : selectedFilter,
        )

        if (!isActive || latestRequestIdRef.current !== requestId) {
          return
        }

        if (error) {
          console.error('Error fetching projects:', error)
          return
        }

        setProjects(fetchedProjects || [])
      } catch (error) {
        if (!isActive || latestRequestIdRef.current !== requestId) {
          return
        }

        console.error('Error fetching projects:', error)
      } finally {
        if (isActive && latestRequestIdRef.current === requestId) {
          setLoading(false)
        }
      }
    }

    fetchProjects()

    return () => {
      isActive = false
    }
  }, [authReady, initialFilter, initialSort, selectedTrending, selectedFilter])

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
