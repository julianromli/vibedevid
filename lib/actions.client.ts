import type * as actions from './actions'
import { createRpcAction } from '@/lib/rpc-client'

export const signIn = createRpcAction<
  Parameters<typeof actions.signIn>,
  Awaited<ReturnType<typeof actions.signIn>>
>('actions.signIn')
export const signUp = createRpcAction<
  Parameters<typeof actions.signUp>,
  Awaited<ReturnType<typeof actions.signUp>>
>('actions.signUp')
export const signOut = createRpcAction<
  Parameters<typeof actions.signOut>,
  Awaited<ReturnType<typeof actions.signOut>>
>('actions.signOut')
export const resetPassword = createRpcAction<
  Parameters<typeof actions.resetPassword>,
  Awaited<ReturnType<typeof actions.resetPassword>>
>('actions.resetPassword')
export const resendConfirmationEmail = createRpcAction<
  Parameters<typeof actions.resendConfirmationEmail>,
  Awaited<ReturnType<typeof actions.resendConfirmationEmail>>
>('actions.resendConfirmationEmail')
export const getProjectBySlug = createRpcAction<
  Parameters<typeof actions.getProjectBySlug>,
  Awaited<ReturnType<typeof actions.getProjectBySlug>>
>('actions.getProjectBySlug')
export const getProject = createRpcAction<
  Parameters<typeof actions.getProject>,
  Awaited<ReturnType<typeof actions.getProject>>
>('actions.getProject')
export const incrementProjectViews = createRpcAction<
  Parameters<typeof actions.incrementProjectViews>,
  Awaited<ReturnType<typeof actions.incrementProjectViews>>
>('actions.incrementProjectViews')
export const incrementBlogPostViews = createRpcAction<
  Parameters<typeof actions.incrementBlogPostViews>,
  Awaited<ReturnType<typeof actions.incrementBlogPostViews>>
>('actions.incrementBlogPostViews')
export const toggleLike = createRpcAction<
  Parameters<typeof actions.toggleLike>,
  Awaited<ReturnType<typeof actions.toggleLike>>
>('actions.toggleLike')
export const getLikeStatus = createRpcAction<
  Parameters<typeof actions.getLikeStatus>,
  Awaited<ReturnType<typeof actions.getLikeStatus>>
>('actions.getLikeStatus')
export const signInWithGoogle = createRpcAction<
  Parameters<typeof actions.signInWithGoogle>,
  Awaited<ReturnType<typeof actions.signInWithGoogle>>
>('actions.signInWithGoogle')
export const signInWithGitHub = createRpcAction<
  Parameters<typeof actions.signInWithGitHub>,
  Awaited<ReturnType<typeof actions.signInWithGitHub>>
>('actions.signInWithGitHub')
export const getBatchLikeStatus = createRpcAction<
  Parameters<typeof actions.getBatchLikeStatus>,
  Awaited<ReturnType<typeof actions.getBatchLikeStatus>>
>('actions.getBatchLikeStatus')
export const editProject = createRpcAction<
  Parameters<typeof actions.editProject>,
  Awaited<ReturnType<typeof actions.editProject>>
>('actions.editProject')
export const fetchProjectsWithSorting = createRpcAction<
  Parameters<typeof actions.fetchProjectsWithSorting>,
  Awaited<ReturnType<typeof actions.fetchProjectsWithSorting>>
>('actions.fetchProjectsWithSorting')
export const deleteProject = createRpcAction<
  Parameters<typeof actions.deleteProject>,
  Awaited<ReturnType<typeof actions.deleteProject>>
>('actions.deleteProject')
