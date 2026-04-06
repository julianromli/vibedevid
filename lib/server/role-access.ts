import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const ROLES = {
  ADMIN: 0,
  MODERATOR: 1,
  USER: 2,
} as const

export interface CurrentRoleAccess {
  userId: string
  role: number
  isAdmin: boolean
  isModerator: boolean
  canAccessAdminDashboard: boolean
  canManageAdminDashboard: boolean
}

async function loadCurrentRoleAccess(): Promise<CurrentRoleAccess | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data: profile, error: profileError } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (profileError || !profile) {
    return null
  }

  const role = profile.role ?? ROLES.USER
  const isAdmin = role === ROLES.ADMIN
  const isModerator = role === ROLES.MODERATOR

  return {
    userId: user.id,
    role,
    isAdmin,
    isModerator,
    canAccessAdminDashboard: isAdmin || isModerator,
    canManageAdminDashboard: isAdmin,
  }
}

export const getCurrentRoleAccess = cache(loadCurrentRoleAccess)

export async function requireElevatedAccess() {
  const access = await getCurrentRoleAccess()

  if (!access?.canAccessAdminDashboard) {
    throw new Error('Elevated access required')
  }

  return access
}

export async function requireAdminAccess() {
  const access = await getCurrentRoleAccess()

  if (!access?.canManageAdminDashboard) {
    throw new Error('Admin access required')
  }

  return access
}
