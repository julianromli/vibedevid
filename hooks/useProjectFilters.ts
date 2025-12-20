/**
 * Project filtering and sorting hook
 * Handles filter state, sorting, and data fetching
 */

import { useEffect, useState } from 'react'
import { fetchProjectsWithSorting } from '@/lib/actions'
import { getCategories } from '@/lib/categories'
import type { Project, SortBy } from '@/types/homepage'

export function useProjectFilters(authReady: boolean) {
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [selectedTrending, setSelectedTrending] = useState('Trending')
  const [visibleProjects, setVisibleProjects] = useState(6)
  const [filterOptions, setFilterOptions] = useState<string[]>(['All'])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch categories for filter options
  useEffect(() => {
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
  }, [])

  // Fetch projects with sorting
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log('[useProjectFilters] Fetching projects with sorting:', {
          selectedTrending,
          selectedFilter,
          authReady,
        })

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
          console.error('[useProjectFilters] Error fetching projects:', error)
          return
        }

        console.log('[useProjectFilters] Projects fetched with sorting:', fetchedProjects.length)
        setProjects(fetchedProjects || [])
      } catch (error) {
        console.error('[useProjectFilters] Error fetching projects:', error)
      } finally {
        setLoading(false)
      }
    }

    if (authReady) {
      fetchProjects()
    }
  }, [authReady, selectedTrending, selectedFilter])

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
