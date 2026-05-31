import { createRpcAction } from '@/lib/rpc-client'

export const getAllUsers = createRpcAction('admin-users.getAllUsers')
export const updateUserRole = createRpcAction('admin-users.updateUserRole')
export const suspendUser = createRpcAction('admin-users.suspendUser')
export const getUserStats = createRpcAction('admin-users.getUserStats')
