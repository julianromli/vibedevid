/**
 * Project Showcase Context
 *
 * Owns all project filtering/sorting state via `useProjectFilters` and exposes
 * it through a generic `{ state, actions, meta }` interface. This is the only
 * place that knows *how* the state is managed, so the page no longer drills
 * filter props into `ProjectShowcase`, and subcomponents read what they need
 * from context instead of props.
 */

'use client'

import { createContext, use, useMemo } from 'react'
import { useProjectFilters } from '@/hooks/useProjectFilters'
import type { Project, ProjectFilterOption, SortBy } from '@/types/homepage'

interface ProjectShowcaseState {
  projects: Project[]
  loading: boolean
  selectedFilter: string
  selectedTrending: SortBy
  filterOptions: ProjectFilterOption[]
}

interface ProjectShowcaseActions {
  setSelectedFilter: (filter: string) => void
  setSelectedTrending: (trending: SortBy) => void
}

interface ProjectShowcaseContextValue {
  state: ProjectShowcaseState
  actions: ProjectShowcaseActions
}

const ProjectShowcaseContext = createContext<ProjectShowcaseContextValue | null>(null)

interface ProjectShowcaseProviderProps {
  children: React.ReactNode
  initialProjects: Project[]
  initialCategories: ProjectFilterOption[]
  initialFilter: string
  initialSort: SortBy
}

export function ProjectShowcaseProvider({
  children,
  initialProjects,
  initialCategories,
  initialFilter,
  initialSort,
}: ProjectShowcaseProviderProps) {
  const projectFilters = useProjectFilters({
    authReady: true,
    initialProjects,
    initialCategories,
    initialFilter,
    initialSort,
  })

  const value = useMemo<ProjectShowcaseContextValue>(
    () => ({
      state: {
        projects: projectFilters.projects,
        loading: projectFilters.loading,
        selectedFilter: projectFilters.selectedFilter,
        selectedTrending: projectFilters.selectedTrending,
        filterOptions: projectFilters.filterOptions,
      },
      actions: {
        setSelectedFilter: projectFilters.setSelectedFilter,
        setSelectedTrending: projectFilters.setSelectedTrending,
      },
    }),
    [
      projectFilters.projects,
      projectFilters.loading,
      projectFilters.selectedFilter,
      projectFilters.selectedTrending,
      projectFilters.filterOptions,
      projectFilters.setSelectedFilter,
      projectFilters.setSelectedTrending,
    ],
  )

  return <ProjectShowcaseContext value={value}>{children}</ProjectShowcaseContext>
}

export function useProjectShowcase(): ProjectShowcaseContextValue {
  const context = use(ProjectShowcaseContext)
  if (!context) {
    throw new Error('useProjectShowcase must be used within a ProjectShowcaseProvider')
  }
  return context
}
