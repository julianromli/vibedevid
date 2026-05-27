'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { RoleSchema, ROLES, SearchSchema, UserIdSchema } from './schemas'

export interface PrivilegedUser {
  id: string
  username: string
  display_name: string
  email: string
  avatar_url: string | null
  role: number
  joined_at: string
  is_current_user: boolean
}

export interface PrivilegedUsersResult {
  success: boolean
  users?: PrivilegedUser[]
  adminCount?: number
  moderatorCount?: number
  currentUserId?: string
  error?: string
}

export interface UserSearchResult {
  success: boolean
  users?: Array<{
    id: string
    username: string
    display_name: string
    email: string
    avatar_url: string | null
    role: number
  }>
  error?: string
}

async function getAdminSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

  if (!userData || userData.role !== ROLES.ADMIN) {
    throw new Error('Admin access required')
  }

  return { userId: user.id }
}

async function getEmailMap(userIds: string[]) {
  const adminClient = createAdminClient()
  const emailMap: Record<string, string> = {}

  if (userIds.length === 0) return emailMap

  const { data: authData, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 })

  if (error) {
    console.error('List auth users error:', error)
    return emailMap
  }

  const idSet = new Set(userIds)
  authData?.users?.forEach((authUser) => {
    if (idSet.has(authUser.id)) {
      emailMap[authUser.id] = authUser.email || ''
    }
  })

  return emailMap
}

function formatPrivilegedUser(
  user: {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
    role: number | null
    joined_at: string
  },
  emailMap: Record<string, string>,
  currentUserId: string,
): PrivilegedUser {
  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    email: emailMap[user.id] || '',
    avatar_url: user.avatar_url,
    role: user.role ?? ROLES.USER,
    joined_at: user.joined_at,
    is_current_user: user.id === currentUserId,
  }
}

export async function getPrivilegedUsers(): Promise<PrivilegedUsersResult> {
  try {
    const { userId } = await getAdminSession()
    const adminClient = createAdminClient()

    const { data: users, error } = await adminClient
      .from('users')
      .select('id, username, display_name, avatar_url, role, joined_at')
      .in('role', [ROLES.ADMIN, ROLES.MODERATOR])
      .order('role', { ascending: true })
      .order('joined_at', { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    const emailMap = await getEmailMap(users?.map((u) => u.id) || [])
    const formatted = (users || []).map((user) => formatPrivilegedUser(user, emailMap, userId))

    return {
      success: true,
      users: formatted,
      adminCount: formatted.filter((u) => u.role === ROLES.ADMIN).length,
      moderatorCount: formatted.filter((u) => u.role === ROLES.MODERATOR).length,
      currentUserId: userId,
    }
  } catch (error) {
    console.error('Get privileged users error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load admin users',
    }
  }
}

export async function searchUsersForAdminGrant(query: string): Promise<UserSearchResult> {
  try {
    await getAdminSession()

    const trimmed = query.trim()
    if (trimmed.length < 2) {
      return { success: true, users: [] }
    }

    const sanitized = SearchSchema.parse(trimmed)
    const adminClient = createAdminClient()

    const { data: users, error } = await adminClient
      .from('users')
      .select('id, username, display_name, avatar_url, role')
      .eq('role', ROLES.USER)
      .or(`username.ilike.%${sanitized}%,display_name.ilike.%${sanitized}%`)
      .order('joined_at', { ascending: false })
      .limit(10)

    if (error) {
      return { success: false, error: error.message }
    }

    const emailMap = await getEmailMap(users?.map((u) => u.id) || [])

    return {
      success: true,
      users: (users || []).map((user) => ({
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        email: emailMap[user.id] || '',
        avatar_url: user.avatar_url,
        role: user.role ?? ROLES.USER,
      })),
    }
  } catch (error) {
    console.error('Search users for admin grant error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search users',
    }
  }
}

async function countAdmins(adminClient: ReturnType<typeof createAdminClient>) {
  const { count, error } = await adminClient
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', ROLES.ADMIN)

  if (error) {
    throw new Error(error.message)
  }

  return count || 0
}

export async function setPrivilegedUserRole(
  userId: string,
  role: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsedUserId = UserIdSchema.parse(userId)
    const parsedRole = RoleSchema.parse(role)
    const { userId: currentUserId } = await getAdminSession()
    const adminClient = createAdminClient()

    const { data: targetUser, error: fetchError } = await adminClient
      .from('users')
      .select('id, role, username, display_name')
      .eq('id', parsedUserId)
      .single()

    if (fetchError || !targetUser) {
      return { success: false, error: 'User not found' }
    }

    const currentRole = targetUser.role ?? ROLES.USER
    const isDemotingAdmin = currentRole === ROLES.ADMIN && parsedRole !== ROLES.ADMIN

    if (isDemotingAdmin) {
      if (parsedUserId === currentUserId) {
        return { success: false, error: 'You cannot remove your own admin access' }
      }

      const adminCount = await countAdmins(adminClient)
      if (adminCount <= 1) {
        return { success: false, error: 'Cannot remove the last admin on the platform' }
      }
    }

    const { error: updateError } = await adminClient
      .from('users')
      .update({ role: parsedRole, updated_at: new Date().toISOString() })
      .eq('id', parsedUserId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Set privileged user role error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update role',
    }
  }
}

export async function grantAdminAccess(userId: string) {
  return setPrivilegedUserRole(userId, ROLES.ADMIN)
}

export async function grantModeratorAccess(userId: string) {
  return setPrivilegedUserRole(userId, ROLES.MODERATOR)
}

export async function revokePrivilegedAccess(userId: string) {
  return setPrivilegedUserRole(userId, ROLES.USER)
}
