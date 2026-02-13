/**
 * Project filtering and sorting hook
 * Handles filter state, sorting, and data fetching
 */

import { useEffect, useState } from 'react'
import { fetchProjectsWithSorting } from '@/lib/actions'
import { getCategories } from '@/lib/categories'
import type { Project, SortBy } from '@/types/homepage'

interface UseProjectFiltersOptions {
  authReady: boolean
  initialProjects?: Project[]
  initialFilterOptions?: string[]
}

export function useProjectFilters({
  authReady,
  initialProjects = [],
  initialFilterOptions = ['All'],
}: UseProjectFiltersOptions) {
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [selectedTrending, setSelectedTrending] = useState('Trending')
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
        setFilterOptions(['All', ...categoryDisplayNames])
      } catch (error) {
        console.error('Failed to fetch categories for filters:', error)
      }
    }

    fetchFilterCategories()
  }, [initialFilterOptions])

  // Fetch projects with sorting
  useEffect(() => {
    if (!authReady) {
      return
    }

    if (skipInitialFetch && selectedTrending === 'Trending' && selectedFilter === 'All') {
      setSkipInitialFetch(false)
      return
    }

    const fetchProjects = async () => {
      try {
        setLoading(true)

        // Convert selectedTrending to sortBy parameter
        let sortBy: SortBy = 'newest'
        switch (selectedTrending) {
          case 'Trending':
            sortBy = 'trending'
            break
          case 'Top':
            sortBy = 'top'
            break
          case 'Newest':
          default:
            sortBy = 'newest'
            break
        }

        // Fetch projects with new sorting function
        const { projects: fetchedProjects, error } = await fetchProjectsWithSorting(
          sortBy,
          selectedFilter === 'All' ? undefined : selectedFilter,
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
  }, [authReady, selectedTrending, selectedFilter, skipInitialFetch])

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
