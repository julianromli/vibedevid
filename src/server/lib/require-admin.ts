import type { Context } from 'hono'
import { getCurrentUser } from '@/lib/actions/user'
import type { User } from '@/types/homepage'

const ADMIN_ROLE = 0

export async function requireAdmin(c: Context): Promise<User | Response> {
  const { user, error } = await getCurrentUser()

  if (error || !user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  if (user.role !== ADMIN_ROLE) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  return user
}

export function isUser(value: User | Response): value is User {
  return typeof value === 'object' && value !== null && 'id' in value && !('status' in value)
}
