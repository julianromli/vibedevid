/**
 * Project filtering and sorting hook
 * Handles filter state, sorting, and data fetching
 */

import { useEffect, useState } from 'react'
import { fetchProjectsWithSorting } from '@/lib/actions'
import { getCategories } from '@/lib/categories'
import { ALL_PROJECT_FILTER_VALUE } from '@/lib/constants/project-filters'
import type { Project, SortBy } from '@/types/homepage'

interface UseProjectFiltersOptions {
  authReady: boolean
  initialProjects?: Project[]
  initialFilterOptions?: string[]
}

export function useProjectFilters({
  authReady,
  initialProjects = [],
  initialFilterOptions = [ALL_PROJECT_FILTER_VALUE],
}: UseProjectFiltersOptions) {
  const [selectedFilter, setSelectedFilter] = useState(ALL_PROJECT_FILTER_VALUE)
  const [selectedTrending, setSelectedTrending] = useState<SortBy>('trending')
  const [visibleProjects, setVisibleProjects] = useState(6)
  const [filterOptions, setFilterOptions] = useState<string[]>(initialFilterOptions)
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [loading, setLoading] = useState(initialProjects.length === 0)
  const [skipInitialFetch, setSkipInitialFetch] = useState(initialProjects.length > 0)

  // Fetch categories for filter options
  useEffect(() => {
    if (initialFilterOptions.length > 1) {
      return
    }

    const fetchFilterCategories = async () => {
      try {
        const categories = await getCategories()
        const categoryDisplayNames = categories.map((cat) => cat.display_name)
        setFilterOptions([ALL_PROJECT_FILTER_VALUE, ...categoryDisplayNames])
      } catch {
        setFilterOptions(initialFilterOptions)
      }
    }

    fetchFilterCategories()
  }, [initialFilterOptions])

  // Fetch projects with sorting
  useEffect(() => {
    if (!authReady) {
      return
    }

    if (skipInitialFetch && selectedTrending === 'trending' && selectedFilter === ALL_PROJECT_FILTER_VALUE) {
      setSkipInitialFetch(false)
      return
    }

    const fetchProjects = async () => {
      try {
        setLoading(true)

        const { projects: fetchedProjects, error } = await fetchProjectsWithSorting(
          selectedTrending,
          selectedFilter === ALL_PROJECT_FILTER_VALUE ? undefined : selectedFilter,
          20, // limit
        )

        if (error) {
          setProjects(initialProjects)
          return
        }

        setProjects(fetchedProjects || [])
      } catch {
        setProjects(initialProjects)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [authReady, initialProjects, selectedTrending, selectedFilter, skipInitialFetch])

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
