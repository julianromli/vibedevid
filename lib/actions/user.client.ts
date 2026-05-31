import { createRpcAction } from '@/lib/rpc-client'

export const getCurrentUser = createRpcAction('user.getCurrentUser')
export const updateUserProfile = createRpcAction('user.updateUserProfile')
