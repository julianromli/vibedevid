/**
 * Centralized authentication hook
 * Handles auth state detection, user profile fetching, and auth state changes
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/homepage'

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [creatingProfile, setCreatingProfile] = useState(false)

  useEffect(() => {
    let isMounted = true

    const supabase = createClient()

    // SECURITY NOTE: getSession() is client-safe because:
    // 1. Middleware refreshes sessions (middleware.ts uses getUser())
    // 2. Real-time sync via onAuthStateChange catches updates
    // 3. Server-side validation uses getUser() (lib/server/auth.ts)
    // Reference: https://supabase.com/docs/guides/auth/server-side/creating-a-client
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      console.log('[useAuth] Auth state change:', event, session)

      if (event === 'INITIAL_SESSION') {
        // Session loaded - auth is ready (no timeout needed)
        setAuthReady(true)
        if (session?.user) {
          setIsLoggedIn(true)
          await fetchUserProfile(session.user.id, session.user.email || '')
        }
      } else if (event === 'SIGNED_IN' && session) {
        setIsLoggedIn(true)
        await fetchUserProfile(session.user.id, session.user.email || '')
        setAuthReady(true)
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false)
        setUser(null)
        setCreatingProfile(false)
        setAuthReady(true)
      }
    })

    // Helper function to fetch user profile
    const fetchUserProfile = async (userId: string, email: string) => {
      try {
        const { data: profile } = await supabase.from('users').select('*').eq('id', userId).single()

        if (!isMounted) return

        if (profile) {
          const userData = {
            id: profile.id,
            name: profile.display_name,
            email,
            avatar: profile.avatar_url || '/vibedev-guest-avatar.png',
            username: profile.username,
            role: profile.role ?? null,
          }
          setUser(userData)
        }
      } catch (error) {
        console.error('[useAuth] Error fetching profile:', error)
      }
    }

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return {
    isLoggedIn,
    user,
    authReady,
    creatingProfile,
  }
}
