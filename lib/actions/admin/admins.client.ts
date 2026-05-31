import { createRpcAction } from '@/lib/rpc-client'

export const getPrivilegedUsers = createRpcAction('admin-admins.getPrivilegedUsers')
export const searchUsersForAdminGrant = createRpcAction('admin-admins.searchUsersForAdminGrant')
export const setPrivilegedUserRole = createRpcAction('admin-admins.setPrivilegedUserRole')
export const grantAdminAccess = createRpcAction('admin-admins.grantAdminAccess')
export const grantModeratorAccess = createRpcAction('admin-admins.grantModeratorAccess')
export const revokePrivilegedAccess = createRpcAction('admin-admins.revokePrivilegedAccess')
