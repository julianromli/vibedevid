/**
 * Project filtering and sorting hook
 * Handles filter state, sorting, and data fetching
 */

import { useEffect, useRef, useState } from 'react'
import { fetchProjectsWithSortingFn } from '@/lib/actions/projects.functions'
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
const DEFAULT_SORT: SortBy = 'newest'
const PROJECT_FETCH_TIMEOUT_MS = 10_000

type FetchProjectsResult = Awaited<ReturnType<typeof fetchProjectsWithSortingFn>>

async function fetchProjectsWithTimeout(sortBy: SortBy, category?: string): Promise<FetchProjectsResult> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      fetchProjectsWithSortingFn({ data: { sortBy, category, limit: 20 } }),
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

function isCurrentProjectRequest(isActive: boolean, currentRequestId: number, requestId: number): boolean {
  return isActive && currentRequestId === requestId
}

async function loadFilteredProjects(sortBy: SortBy, selectedFilter: string): Promise<Project[]> {
  const { projects, error } = await fetchProjectsWithTimeout(
    sortBy,
    selectedFilter === ALL_FILTER_VALUE ? undefined : selectedFilter,
  )

  if (error) {
    throw new Error(error)
  }

  return projects || []
}

export function useProjectFilters({
  authReady,
  initialProjects = [],
  initialCategories = [],
  initialFilter = ALL_FILTER_VALUE,
  initialSort = DEFAULT_SORT,
}: UseProjectFiltersOptions) {
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

  // Fetch projects with sorting while ignoring stale responses.
  useEffect(() => {
    if (!authReady) {
      return
    }

    if (shouldSkipInitialFetchRef.current && selectedTrending === initialSort && selectedFilter === initialFilter) {
      shouldSkipInitialFetchRef.current = false
      return
    }

    const requestId = latestRequestIdRef.current + 1
    latestRequestIdRef.current = requestId
    let isActive = true

    const fetchProjects = async () => {
      try {
        setLoading(true)

        const fetchedProjects = await loadFilteredProjects(selectedTrending, selectedFilter)

        if (!isCurrentProjectRequest(isActive, latestRequestIdRef.current, requestId)) {
          return
        }

        setProjects(fetchedProjects)
      } catch (error) {
        if (!isCurrentProjectRequest(isActive, latestRequestIdRef.current, requestId)) {
          return
        }

        console.error('Error fetching projects:', error)
      } finally {
        if (isCurrentProjectRequest(isActive, latestRequestIdRef.current, requestId)) {
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
