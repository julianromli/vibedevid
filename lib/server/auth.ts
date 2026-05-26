'use server'

import { getCurrentUser as getCurrentUserFromActions } from '@/lib/actions/user'
import { createClient } from '@/lib/supabase/server'

export async function getServerSession() {
  const supabase = await createClient()
  // Use getUser() to validate the user's session on the server
  // This is more secure than getSession() as it validates the token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return { user }
}

export async function getCurrentUser() {
  const { user } = await getCurrentUserFromActions()
  if (!user?.id) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || user.avatar_url || '/placeholder.svg',
    avatar_url: user.avatar_url || user.avatar || '/placeholder.svg',
    username: user.username,
    role: user.role,
  }
}

export async function checkProjectOwnership(authorUsername: string, userId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('users').select('id').eq('username', authorUsername).single()

  return data?.id === userId
}
