'use server'

import { createClient } from '@/lib/supabase/server'

export async function getServerSession() {
  const supabase = await createClient()
  // Use getUser() to validate the user's session on the server
  // This is more secure than getSession() as it validates the token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Return a partial session object containing just the user
  // This satisfies the usage in getCurrentUser which only checks session.user
  return { user } as any
}

export async function getCurrentUser() {
  const session = await getServerSession()
  if (!session?.user) return null

  const supabase = await createClient()
  const { data: user } = await supabase.from('users').select('*').eq('id', session.user.id).single()

  return user
    ? {
        id: user.id,
        name: user.display_name,
        email: session.user.email || '',
        avatar: user.avatar_url || '/placeholder.svg',
        avatar_url: user.avatar_url || '/placeholder.svg',
        username: user.username,
        role: user.role,
      }
    : null
}

export async function checkProjectOwnership(authorUsername: string, userId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('users').select('id').eq('username', authorUsername).single()

  return data?.id === userId
}
