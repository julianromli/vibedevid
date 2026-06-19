import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import {
  getAnalyticsTimeSeries as getAnalyticsTimeSeriesAction,
  getCommunityHealthCounts as getCommunityHealthCountsAction,
  getContentGrowthTimeSeries as getContentGrowthTimeSeriesAction,
  getMostViewedPosts as getMostViewedPostsAction,
  getMostViewedProjects as getMostViewedProjectsAction,
  getPeriodSignupStats as getPeriodSignupStatsAction,
  getPlatformStats as getPlatformStatsAction,
  getPostsByStatus as getPostsByStatusAction,
  getProjectsByCategory as getProjectsByCategoryAction,
  getUsersByRole as getUsersByRoleAction,
} from '@/lib/actions/analytics'

const daysSchema = z.object({ days: z.number().int().positive().max(365).default(30) })
const limitSchema = z.object({ limit: z.number().int().positive().max(100).default(10) })

export const getPlatformStatsFn = createServerFn({ method: 'GET' }).handler(async () => getPlatformStatsAction())

export const getMostViewedProjectsFn = createServerFn({ method: 'GET' })
  .validator(limitSchema)
  .handler(async ({ data }) => getMostViewedProjectsAction(data.limit))

export const getMostViewedPostsFn = createServerFn({ method: 'GET' })
  .validator(limitSchema)
  .handler(async ({ data }) => getMostViewedPostsAction(data.limit))

export const getAnalyticsTimeSeriesFn = createServerFn({ method: 'GET' })
  .validator(daysSchema)
  .handler(async ({ data }) => getAnalyticsTimeSeriesAction(data.days))

export const getContentGrowthTimeSeriesFn = createServerFn({ method: 'GET' })
  .validator(daysSchema)
  .handler(async ({ data }) => getContentGrowthTimeSeriesAction(data.days))

export const getPeriodSignupStatsFn = createServerFn({ method: 'GET' })
  .validator(daysSchema)
  .handler(async ({ data }) => getPeriodSignupStatsAction(data.days))

export const getProjectsByCategoryFn = createServerFn({ method: 'GET' })
  .validator(limitSchema)
  .handler(async ({ data }) => getProjectsByCategoryAction(data.limit))

export const getUsersByRoleFn = createServerFn({ method: 'GET' }).handler(async () => getUsersByRoleAction())

export const getPostsByStatusFn = createServerFn({ method: 'GET' }).handler(async () => getPostsByStatusAction())

export const getCommunityHealthCountsFn = createServerFn({ method: 'GET' }).handler(async () =>
  getCommunityHealthCountsAction(),
)
