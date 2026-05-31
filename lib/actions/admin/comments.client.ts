import { createRpcAction } from '@/lib/rpc-client'

export const getReportedComments = createRpcAction('admin-comments.getReportedComments')
export const adminDeleteComment = createRpcAction('admin-comments.adminDeleteComment')
export const dismissReport = createRpcAction('admin-comments.dismissReport')
export const takeActionOnReport = createRpcAction('admin-comments.takeActionOnReport')
export const getCommentModerationStats = createRpcAction('admin-comments.getCommentModerationStats')
