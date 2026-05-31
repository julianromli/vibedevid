import { createRpcAction } from '@/lib/rpc-client'

export const getPlatformStats = createRpcAction('analytics.getPlatformStats')
export const getMostViewedProjects = createRpcAction('analytics.getMostViewedProjects')
export const getMostViewedPosts = createRpcAction('analytics.getMostViewedPosts')
export const getContentGrowthTimeSeries = createRpcAction('analytics.getContentGrowthTimeSeries')
export const getProjectsByCategory = createRpcAction('analytics.getProjectsByCategory')
export const getUsersByRole = createRpcAction('analytics.getUsersByRole')
export const getPostsByStatus = createRpcAction('analytics.getPostsByStatus')
export const getCommunityHealthCounts = createRpcAction('analytics.getCommunityHealthCounts')
export const getPeriodSignupStats = createRpcAction('analytics.getPeriodSignupStats')
export const getAnalyticsTimeSeries = createRpcAction('analytics.getAnalyticsTimeSeries')
