import { createRpcAction } from '@/lib/rpc-client'

export const createComment = createRpcAction('comments.createComment')
export const getComments = createRpcAction('comments.getComments')
export const reportComment = createRpcAction('comments.reportComment')
