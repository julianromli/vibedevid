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

    const setSignedOutState = () => {
      setIsLoggedIn(false)
      setUser(null)
    }

    const setReadyIfMounted = () => {
      if (isMounted) {
        setAuthReady(true)
      }
    }

    const getFallbackUser = (userId: string, email: string): User => ({
      id: userId,
      name: email.split('@')[0] || 'User',
      email,
      avatar: '/vibedev-guest-avatar.png',
      username: '',
      role: null,
    })

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
          return
        }

        setUser(getFallbackUser(userId, email))
      } catch (error) {
        console.error('[useAuth] Error fetching profile:', error)
        if (!isMounted) return
        setUser(getFallbackUser(userId, email))
      }
    }

    const hydrateInitialAuth = async () => {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser()

      if (!isMounted) return

      if (error) {
        console.error('[useAuth] Initial auth hydration failed:', error)
        setSignedOutState()
        setReadyIfMounted()
        return
      }

      if (!authUser) {
        setSignedOutState()
        setReadyIfMounted()
        return
      }

      setIsLoggedIn(true)
      setUser(getFallbackUser(authUser.id, authUser.email || ''))
      await fetchUserProfile(authUser.id, authUser.email || '')
      setReadyIfMounted()
    }

    const handleInitialOrSignedIn = async (
      event: 'INITIAL_SESSION' | 'SIGNED_IN',
      session: { user: { id: string; email?: string | null } } | null,
    ) => {
      if (!session?.user) {
        if (event === 'INITIAL_SESSION') {
          setSignedOutState()
        }
        setAuthReady(true)
        return
      }

      setIsLoggedIn(true)
      setUser(getFallbackUser(session.user.id, session.user.email || ''))
      await fetchUserProfile(session.user.id, session.user.email || '')
      setAuthReady(true)
    }

    const handleAuthStateChange = async (
      event: string,
      session: { user: { id: string; email?: string | null } } | null,
    ) => {
      if (!isMounted) return

      console.log('[useAuth] Auth state change:', event, session)

      if (event === 'SIGNED_OUT') {
        setSignedOutState()
        setCreatingProfile(false)
        setAuthReady(true)
        return
      }

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        await handleInitialOrSignedIn(event, session)
      }
    }

    hydrateInitialAuth()

    // SECURITY NOTE: getSession() is client-safe because:
    // 1. Middleware refreshes sessions (middleware.ts uses getUser())
    // 2. Real-time sync via onAuthStateChange catches updates
    // 3. Server-side validation uses getUser() (lib/server/auth.ts)
    // Reference: https://supabase.com/docs/guides/auth/server-side/creating-a-client
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange)

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
