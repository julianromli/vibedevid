'use server'

import { createClient } from '@/lib/supabase/server'
import type { User } from '@/types/homepage'

export async function getCurrentUser(): Promise<{ user: User | null; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return { user: null, error: 'Not authenticated' }
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (userError || !userData) {
      return { user: null, error: 'User not found' }
    }

    return {
      user: {
        id: userData.id,
        username: userData.username,
        name: userData.display_name,
        displayName: userData.display_name,
        email: authData.user.email || '',
        avatar: userData.avatar_url,
        avatar_url: userData.avatar_url,
        role: userData.role,
      } as User,
    }
  } catch (error) {
    console.error('Error fetching current user:', error)
    return { user: null, error: 'Failed to fetch user' }
  }
}
