/**
 * Project filtering and sorting hook
 * Handles filter state, sorting, and data fetching
 */

import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { fetchProjectsWithSortingFn } from "@/lib/actions/projects.functions";
import { getCategoriesFn } from "@/lib/categories";
import { PROJECT_PAGE_SIZE } from "@/lib/project-page-cursor";
import type { Project, ProjectFilterOption, SortBy } from "@/types/homepage";

interface UseProjectFiltersOptions {
  authReady: boolean;
  initialProjects?: Project[];
  initialCategories?: ProjectFilterOption[];
  initialFilter?: string;
  initialSort?: SortBy;
  initialNextCursor?: string | null;
  initialError?: string | null;
  initialAuthor?: string;
}

const ALL_FILTER_VALUE = "all";
const DEFAULT_SORT: SortBy = "newest";
const PROJECT_FETCH_TIMEOUT_MS = 10_000;

type FetchProjectsResult = Awaited<ReturnType<typeof fetchProjectsWithSortingFn>>;

async function fetchProjectsWithTimeout(
  sortBy: SortBy,
  category?: string,
  cursor?: string | null,
  authorUsername?: string,
): Promise<FetchProjectsResult> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      fetchProjectsWithSortingFn({
        data: {
          sortBy,
          category,
          limit: PROJECT_PAGE_SIZE,
          cursor: cursor ?? undefined,
          authorUsername,
        },
      }),
      new Promise<FetchProjectsResult>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Project fetch timed out after ${PROJECT_FETCH_TIMEOUT_MS}ms`));
        }, PROJECT_FETCH_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function isCurrentProjectRequest(
  isActive: boolean,
  currentRequestId: number,
  requestId: number,
): boolean {
  return isActive && currentRequestId === requestId;
}

async function loadFilteredProjects(
  sortBy: SortBy,
  selectedFilter: string,
  cursor?: string | null,
  authorUsername?: string,
): Promise<{ projects: Project[]; nextCursor: string | null }> {
  const result = await fetchProjectsWithTimeout(
    sortBy,
    selectedFilter === ALL_FILTER_VALUE ? undefined : selectedFilter,
    cursor,
    authorUsername,
  );

  if (result.error) {
    throw new Error(result.error);
  }

  return { projects: result.projects || [], nextCursor: result.nextCursor };
}

export function useProjectFilters({
  authReady,
  initialProjects = [],
  initialCategories = [],
  initialFilter = ALL_FILTER_VALUE,
  initialSort = DEFAULT_SORT,
  initialNextCursor = null,
  initialError = null,
  initialAuthor,
}: UseProjectFiltersOptions) {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilterState] = useState(initialFilter);
  const [selectedTrending, setSelectedTrendingState] = useState<SortBy>(initialSort);
  const [filterOptions, setFilterOptions] = useState<ProjectFilterOption[]>(initialCategories);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(initialProjects.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const shouldSkipInitialFetchRef = useRef(initialProjects.length > 0);
  const latestRequestIdRef = useRef(0);

  // Fetch categories for filter options
  useEffect(() => {
    if (initialCategories.length > 0) {
      return;
    }

    const fetchFilterCategories = async () => {
      try {
        const categories = await getCategoriesFn();
        setFilterOptions(
          categories.map((category) => ({
            value: category.name,
            label: category.display_name,
          })),
        );
      } catch (error) {
        console.error("Failed to fetch categories for filters:", error);
      }
    };

    void fetchFilterCategories();
  }, [initialCategories]);

  // Fetch projects with sorting while ignoring stale responses.
  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (
      shouldSkipInitialFetchRef.current &&
      selectedTrending === initialSort &&
      selectedFilter === initialFilter
    ) {
      shouldSkipInitialFetchRef.current = false;
      return;
    }

    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    let isActive = true;

    const fetchProjects = async () => {
      try {
        setLoading(true);

        const page = await loadFilteredProjects(
          selectedTrending,
          selectedFilter,
          null,
          initialAuthor,
        );

        if (!isCurrentProjectRequest(isActive, latestRequestIdRef.current, requestId)) {
          return;
        }

        setProjects(page.projects);
        setNextCursor(page.nextCursor);
        setError(null);
      } catch (error) {
        if (!isCurrentProjectRequest(isActive, latestRequestIdRef.current, requestId)) {
          return;
        }

        console.error("Error fetching projects:", error);
        setError("Could not load projects");
      } finally {
        if (isCurrentProjectRequest(isActive, latestRequestIdRef.current, requestId)) {
          setLoading(false);
        }
      }
    };

    void fetchProjects();

    return () => {
      isActive = false;
    };
  }, [authReady, initialAuthor, initialFilter, initialSort, selectedTrending, selectedFilter]);

  // Browser back/forward updates the loader search, which replaces this page.
  useEffect(() => {
    setSelectedFilterState(initialFilter);
    setSelectedTrendingState(initialSort);
    setProjects(initialProjects);
    setNextCursor(initialNextCursor);
    setError(initialError);
  }, [initialError, initialFilter, initialNextCursor, initialProjects, initialSort]);

  const loadMore = () => {
    if (!nextCursor || loading || loadingMore) return;

    const requestId = latestRequestIdRef.current;
    const cursor = nextCursor;
    const sortBy = selectedTrending;
    const filter = selectedFilter;
    setLoadingMore(true);

    void loadFilteredProjects(sortBy, filter, cursor, initialAuthor)
      .then((page) => {
        if (latestRequestIdRef.current !== requestId) return;
        setProjects((current) => [...current, ...page.projects]);
        setNextCursor(page.nextCursor);
      })
      .catch((error: unknown) => {
        if (latestRequestIdRef.current !== requestId) return;
        console.error("Error fetching more projects:", error);
        setError("Could not load more projects");
      })
      .finally(() => {
        if (latestRequestIdRef.current === requestId) {
          setLoadingMore(false);
        }
      });
  };

  const writeSearch = (filter: string, sort: SortBy) => {
    void navigate({
      to: ".",
      search: (prev) => ({
        ...(prev as { filter?: string; sort?: string; author?: string }),
        filter: filter === ALL_FILTER_VALUE ? undefined : filter,
        sort: sort === DEFAULT_SORT ? undefined : sort,
      }),
      replace: true,
      resetScroll: false,
    });
  };

  const setSelectedFilter = (filter: string) => {
    setSelectedFilterState(filter);
    writeSearch(filter, selectedTrending);
  };

  const setSelectedTrending = (sort: SortBy) => {
    setSelectedTrendingState(sort);
    writeSearch(selectedFilter, sort);
  };

  return {
    selectedFilter,
    setSelectedFilter,
    selectedTrending,
    setSelectedTrending,
    error,
    filterOptions,
    projects,
    loading,
    loadingMore,
    hasMore: Boolean(nextCursor),
    loadMore,
  };
}
